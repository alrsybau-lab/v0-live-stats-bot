require("dotenv").config({ path: require("path").join(__dirname, "../.env.local") });

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActivityType,
} = require("discord.js");
const fetch = require("node-fetch");

// ── Config ─────────────────────────────────────────────────────────────────────
const DISCORD_TOKEN  = process.env.DISCORD_BOT_TOKEN;
const LOGGED_SESSION = process.env.LOGGED_TG_SESSION_COOKIE; // full cookie string from browser
const STATS_CHANNEL  = process.env.STATS_CHANNEL_ID || null;  // optional channel lock
const PREFIX         = "!";
const API_BASE       = "https://api.injuries.to";
const SESSION_URL    = "https://logged.tg/api/session";

// ── Discord client ─────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ── Auth helpers ───────────────────────────────────────────────────────────────

/**
 * Fetch the logged.tg session to extract Auth.Id and Auth.Token.
 * These are used as x-id / x-token headers on the injuries.to API.
 */
async function getLoggedSession() {
  const res = await fetch(SESSION_URL, {
    method: "GET",
    headers: {
      Cookie: LOGGED_SESSION,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      Referer: "https://logged.tg/dashboard",
    },
  });

  if (!res.ok) {
    throw new Error(`Session fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  // Session shape: { Auth: { Id, Token } } or { Auth: [Id, Token] }
  const authObj = data?.Auth ?? data?.userSettings?.Auth ?? null;

  if (!authObj) {
    throw new Error(
      "Auth tokens not found in session response. " +
        "Your LOGGED_TG_SESSION_COOKIE may be expired — grab a fresh one from your browser."
    );
  }

  const id    = Array.isArray(authObj) ? authObj[0] : (authObj.Id    ?? authObj.id);
  const token = Array.isArray(authObj) ? authObj[1] : (authObj.Token ?? authObj.token);

  if (!id || !token) {
    throw new Error("Auth.Id or Auth.Token missing in session payload.");
  }

  return {
    id:   String(id),
    token: String(token),
    user: data?.userSettings ?? data?.user ?? {},
    raw:  data,
  };
}

/**
 * GET request to the injuries.to API with auth headers.
 */
async function apiGet(path, session) {
  const url = `${API_BASE}${path}`;
  const res  = await fetch(url, {
    method: "GET",
    headers: {
      "x-id":          session.id,
      "x-token":       session.token,
      "content-type":  "application/json; charset=utf-8",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      Origin:  "https://logged.tg",
      Referer: "https://logged.tg/dashboard",
    },
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`API ${path} → ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  }

  return json;
}

// ── Stats fetcher ──────────────────────────────────────────────────────────────

async function fetchStats() {
  const session = await getLoggedSession();

  // Primary endpoint that holds the full omni-user dashboard payload
  const data = await apiGet("/api/auth", session);

  // Dig through the response shape (built from the site's JS schema)
  const mainData    = data?.omniData?.Main?.Data   ?? data ?? {};
  const profile     = data?.omniData?.Profile?.Header ?? {};
  const totals      = mainData?.Totals      ?? {};
  const collectibles= mainData?.Collectibles ?? {};
  const billing     = mainData?.Billing      ?? {};
  const groups      = mainData?.Groups       ?? {};
  const cookies     = mainData?.Cookies      ?? {};

  const userName    = data?.userSettings?.userName
                      ?? profile?.Username
                      ?? session.user?.userName
                      ?? "Unknown";
  const displayName = data?.userSettings?.displayName
                      ?? profile?.DisplayName
                      ?? userName;
  const isPremium   = data?.userSettings?.IsPremium  ?? profile?.IsPremium ?? false;
  const avatar      = data?.userAvatar ?? null;

  return {
    userName,
    displayName,
    isPremium,
    avatar,
    // Hit / account stats
    visits:       totals.Visits   ?? 0,
    accounts:     totals.Accounts ?? 0,
    summary:      totals.Summary  ?? 0,
    rap:          totals.Rap      ?? 0,
    balance:      totals.Balance  ?? 0,
    // Collectibles
    rapItems:    collectibles?.Limiteds?.Rap ?? 0,
    hasKorblox:  collectibles?.Korblox      ?? false,
    hasHeadless: collectibles?.Headless     ?? false,
    // Billing
    subActive:    billing?.Subscription?.Has     ?? false,
    subExpires:   billing?.Subscription?.Expires ?? null,
    billingTotal: billing?.Total                 ?? 0,
    credit:       billing?.Credit?.Balance       ?? 0,
    // Groups
    groupsOwned:  Array.isArray(groups?.Owned) ? groups.Owned.length : (groups?.Owned ?? 0),
    groupBalance: groups?.Balance ?? 0,
    groupPending: groups?.Pending ?? 0,
    // Cookie health
    cookieStatus: cookies?.Security ? "Valid" : "None",
  };
}

// ── Format helpers ─────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return "0";
  const num = Number(n);
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000)     return (num / 1_000).toFixed(1)     + "K";
  return num.toLocaleString("en-US");
}

function robux(n) {
  return `R\$ ${fmt(n)}`;
}

function boolField(val) {
  return val ? "> ✅  Yes" : "> ❌  No";
}

// ── Embed builder ──────────────────────────────────────────────────────────────

function buildStatsEmbed(stats, requester) {
  const color = stats.isPremium ? 0xf5a623 : 0x5865f2;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${stats.displayName}  |  logged.tg Dashboard`)
    .setURL("https://logged.tg/dashboard")
    .setDescription(
      `> Username: \`${stats.userName}\`` +
      (stats.isPremium ? "  —  ⭐ **Premium**" : "")
    )
    .setThumbnail(
      stats.avatar && stats.avatar.startsWith("http")
        ? stats.avatar
        : "https://logged.tg/favicon.ico"
    )

    // ─── Row 1: Core hit counters ──────────────────────────────────────────
    .addFields(
      {
        name: "Total Hits",
        value: `\`\`\`\n${fmt(stats.accounts)}\`\`\``,
        inline: true,
      },
      {
        name: "Site Visits",
        value: `\`\`\`\n${fmt(stats.visits)}\`\`\``,
        inline: true,
      },
      {
        name: "Summary",
        value: `\`\`\`\n${robux(stats.summary)}\`\`\``,
        inline: true,
      }
    )

    // ─── Row 2: Economy ───────────────────────────────────────────────────
    .addFields(
      {
        name: "Total RAP",
        value: `\`\`\`\n${robux(stats.rap)}\`\`\``,
        inline: true,
      },
      {
        name: "Balance",
        value: `\`\`\`\n${robux(stats.balance)}\`\`\``,
        inline: true,
      },
      {
        name: "Limiteds RAP",
        value: `\`\`\`\n${robux(stats.rapItems)}\`\`\``,
        inline: true,
      }
    )

    // ─── Rare items ────────────────────────────────────────────────────────
    .addFields({
      name: "Rare Items",
      value:
        `Korblox:   ${stats.hasKorblox  ? "✅  Yes" : "❌  No"}\n` +
        `Headless:  ${stats.hasHeadless ? "✅  Yes" : "❌  No"}`,
      inline: false,
    })

    // ─── Billing ───────────────────────────────────────────────────────────
    .addFields(
      {
        name: "Subscription",
        value:
          `Active:   ${stats.subActive ? "✅  Yes" : "❌  No"}\n` +
          (stats.subExpires ? `Expires:  ${stats.subExpires}` : ""),
        inline: true,
      },
      {
        name: "Billing",
        value:
          `Total:   ${robux(stats.billingTotal)}\n` +
          `Credit:  ${robux(stats.credit)}`,
        inline: true,
      },
      { name: "\u200b", value: "\u200b", inline: true }
    )

    // ─── Groups ────────────────────────────────────────────────────────────
    .addFields({
      name: "Groups",
      value:
        `Owned:    **${stats.groupsOwned}**\n` +
        `Balance:  ${robux(stats.groupBalance)}\n` +
        `Pending:  ${robux(stats.groupPending)}`,
      inline: true,
    })

    // ─── Cookie ────────────────────────────────────────────────────────────
    .addFields({
      name: "Cookie Status",
      value: stats.cookieStatus === "Valid" ? "✅  Valid" : "❌  None",
      inline: true,
    })

    .setFooter({
      text: `Requested by ${requester.tag}  •  logged.tg`,
      iconURL: requester.displayAvatarURL({ dynamic: true }),
    })
    .setTimestamp();

  return embed;
}

// ── Events ─────────────────────────────────────────────────────────────────────

client.once("ready", () => {
  console.log(`[logged.tg bot] Online as ${client.user.tag}`);
  client.user.setActivity("logged.tg/dashboard", { type: ActivityType.Watching });
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild)     return;

  const content = message.content.trim();
  if (!content.startsWith(PREFIX)) return;

  const command = content.slice(PREFIX.length).trim().split(/\s+/)[0].toLowerCase();

  // ── !stats ─────────────────────────────────────────────────────────────────
  if (command === "stats") {
    // Optional: lock to a specific channel
    if (STATS_CHANNEL && message.channel.id !== STATS_CHANNEL) return;

    await message.channel.sendTyping();

    try {
      const stats = await fetchStats();
      const embed = buildStatsEmbed(stats, message.author);
      await message.reply({ embeds: [embed] });
    } catch (err) {
      console.error("[logged.tg bot] Stats error:", err.message);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle("Failed to fetch stats")
            .setDescription(
              `\`\`\`\n${err.message.slice(0, 400)}\`\`\`\n` +
              "Make sure your `LOGGED_TG_SESSION_COOKIE` is up to date."
            )
            .setTimestamp(),
        ],
      });
    }

    return;
  }

  // ── !help ──────────────────────────────────────────────────────────────────
  if (command === "help") {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle("logged.tg Bot — Commands")
          .addFields(
            { name: "`!stats`", value: "Fetch live stats from your logged.tg dashboard.", inline: false },
            { name: "`!help`",  value: "Show this help message.",                          inline: false }
          )
          .setTimestamp(),
      ],
    });
  }
});

// ── Start ──────────────────────────────────────────────────────────────────────

if (!DISCORD_TOKEN) {
  console.error("[logged.tg bot] DISCORD_BOT_TOKEN is not set in .env.local");
  process.exit(1);
}
if (!LOGGED_SESSION) {
  console.error("[logged.tg bot] LOGGED_TG_SESSION_COOKIE is not set in .env.local");
  process.exit(1);
}

client.login(DISCORD_TOKEN);
