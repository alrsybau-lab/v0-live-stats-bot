require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActivityType,
} = require('discord.js');
const fetch = require('node-fetch');

// ── Config ─────────────────────────────────────────────────────────────────────
const DISCORD_TOKEN   = process.env.DISCORD_BOT_TOKEN;
const LOGGED_SESSION  = process.env.LOGGED_TG_SESSION_COOKIE; // full cookie string
const STATS_CHANNEL   = process.env.STATS_CHANNEL_ID || null;  // optional channel lock
const PREFIX          = '!';
const API_BASE        = 'https://api.injuries.to';
const SESSION_URL     = 'https://logged.tg/api/session';

// ── Discord client ──────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ── Helpers ─────────────────────────────────────────────────────────────────────

/**
 * Fetch the logged.tg session to get Auth.Id and Auth.Token.
 * Returns { id, token, userSettings } or throws on failure.
 */
async function getLoggedSession() {
  const res = await fetch(SESSION_URL, {
    method: 'GET',
    headers: {
      Cookie: LOGGED_SESSION,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      Referer: 'https://logged.tg/dashboard',
    },
  });

  if (!res.ok) {
    throw new Error(`Session fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  // Session shape: { Auth: [Id, Token, ...], userSettings: { userName, ... }, ... }
  const authArr =
    data?.Auth ||
    data?.userSettings?.Auth ||
    data?.Cookies?.Security; // fallback

  if (!authArr) {
    throw new Error('Could not extract Auth from session response');
  }

  const id    = Array.isArray(authArr) ? authArr[0] : authArr.Id;
  const token = Array.isArray(authArr) ? authArr[1] : authArr.Token;

  return {
    id:    String(id),
    token: String(token),
    user:  data?.userSettings || data?.user || {},
    raw:   data,
  };
}

/**
 * Call the injuries.to API with x-id / x-token auth headers.
 * path – relative path, e.g. '/api/auth'
 */
async function apiRequest(path, session) {
  const url = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
  const res  = await fetch(url, {
    method: 'GET',
    headers: {
      'x-id':           session.id,
      'x-token':        session.token,
      'content-type':   'application/json; charset=utf-8',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      Origin:  'https://logged.tg',
      Referer: 'https://logged.tg/dashboard',
    },
  });

  const text = await res.text();

  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!res.ok) {
    throw new Error(`API ${path} returned ${res.status}: ${JSON.stringify(json)}`);
  }

  return json;
}

/**
 * Pull all dashboard stats for the authenticated user.
 * Returns a normalised stats object.
 */
async function fetchStats() {
  const session = await getLoggedSession();

  // The dashboard data lives at /api/auth on the backend
  // (from the schema: omniUser contains Totals, Dates, Collectibles, etc.)
  const data = await apiRequest('/api/auth', session);

  // ── Normalise the response ────────────────────────────────────────────────
  const totals      = data?.omniData?.Main?.Data?.Totals   || data?.Totals   || {};
  const profile     = data?.omniData?.Profile?.Header       || {};
  const collectibles= data?.omniData?.Main?.Data?.Collectibles || data?.Collectibles || {};
  const billing     = data?.omniData?.Main?.Data?.Billing   || data?.Billing  || {};
  const groups      = data?.omniData?.Main?.Data?.Groups    || data?.Groups   || {};
  const cookies     = data?.omniData?.Main?.Data?.Cookies   || data?.Cookies  || {};
  const settings    = data?.omniData?.Main?.Data?.Settings  || {};
  const avatar      = data?.userAvatar || data?.omniData?.userAvatar || null;
  const userName    = data?.userSettings?.userName
                      || profile?.Username
                      || session.user?.userName
                      || 'Unknown';
  const displayName = data?.userSettings?.displayName
                      || profile?.DisplayName
                      || userName;
  const isPremium   = data?.userSettings?.IsPremium
                      || profile?.IsPremium
                      || false;

  return {
    userName,
    displayName,
    isPremium,
    avatar,
    // Core stats
    visits:   totals.Visits   ?? 0,
    accounts: totals.Accounts ?? 0,
    summary:  totals.Summary  ?? 0,   // Robux summary value
    rap:      totals.Rap      ?? 0,
    balance:  totals.Balance  ?? 0,
    // Collectibles
    rapItems:   collectibles?.Limiteds?.Rap          ?? 0,
    hasKorblox: collectibles?.Korblox                ?? false,
    hasHeadless:collectibles?.Headless               ?? false,
    // Billing
    subStatus:  billing?.Subscription?.Has           ?? false,
    subExpires: billing?.Subscription?.Expires       ?? null,
    billingTotal: billing?.Total                     ?? 0,
    credit:     billing?.Credit?.Balance             ?? 0,
    // Groups
    groupsOwned:  (groups?.Owned?.length)            ?? 0,
    groupBalance: groups?.Balance                    ?? 0,
    groupPending: groups?.Pending                    ?? 0,
    // Cookie security
    cookieSecurity: cookies?.Security ? '✅ Valid' : '❌ None',
    // Site info
    siteId:   settings?.siteId   || 'N/A',
    siteCode: settings?.siteCode || 'N/A',
    raw: data,
  };
}

// ── Format helpers ────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null || n === 0) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + 'K';
  return n.toLocaleString();
}

function robux(n) { return `R$ ${fmt(n)}`; }

// ── Build embed ───────────────────────────────────────────────────────────────

function buildStatsEmbed(stats, requester) {
  const now = new Date();

  const color = stats.isPremium ? 0xf5a623 : 0x5865f2; // gold for premium, blurple otherwise

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`📊  ${stats.displayName}'s Stats  |  logged.tg`)
    .setURL('https://logged.tg/dashboard')
    .setDescription(
      `> Account \`${stats.userName}\`${stats.isPremium ? '  ⭐ **Premium**' : ''}`,
    )
    .setThumbnail(
      stats.avatar && stats.avatar.startsWith('http')
        ? stats.avatar
        : 'https://logged.tg/favicon.ico',
    )

    // ── Core hit stats ──────────────────────────────────────────────────────
    .addFields(
      {
        name: '🎯  Total Hits',
        value: `\`\`\`\n${fmt(stats.accounts)}\`\`\``,
        inline: true,
      },
      {
        name: '🌐  Site Visits',
        value: `\`\`\`\n${fmt(stats.visits)}\`\`\``,
        inline: true,
      },
      {
        name: '💰  Total Summary',
        value: `\`\`\`\n${robux(stats.summary)}\`\`\``,
        inline: true,
      },
    )

    // ── Robux / economy ─────────────────────────────────────────────────────
    .addFields(
      {
        name: '💎  Total RAP',
        value: `\`\`\`\n${robux(stats.rap)}\`\`\``,
        inline: true,
      },
      {
        name: '💵  Balance',
        value: `\`\`\`\n${robux(stats.balance)}\`\`\``,
        inline: true,
      },
      {
        name: '🏆  Limiteds RAP',
        value: `\`\`\`\n${robux(stats.rapItems)}\`\`\``,
        inline: true,
      },
    )

    // ── Rare items ──────────────────────────────────────────────────────────
    .addFields({
      name: '🦴  Rare Items',
      value: [
        `• Korblox:   ${stats.hasKorblox  ? '✅ Yes' : '❌ No'}`,
        `• Headless:  ${stats.hasHeadless ? '✅ Yes' : '❌ No'}`,
      ].join('\n'),
      inline: false,
    })

    // ── Billing ─────────────────────────────────────────────────────────────
    .addFields(
      {
        name: '🔔  Subscription',
        value: [
          `Active:   ${stats.subStatus ? '✅ Yes' : '❌ No'}`,
          stats.subExpires ? `Expires: ${stats.subExpires}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        inline: true,
      },
      {
        name: '🧾  Billing',
        value: [
          `Total:   ${robux(stats.billingTotal)}`,
          `Credit:  ${robux(stats.credit)}`,
        ].join('\n'),
        inline: true,
      },
      { name: '\u200b', value: '\u200b', inline: true }, // spacer
    )

    // ── Groups ──────────────────────────────────────────────────────────────
    .addFields({
      name: '👥  Groups',
      value: [
        `• Owned:    **${stats.groupsOwned}**`,
        `• Balance:  ${robux(stats.groupBalance)}`,
        `• Pending:  ${robux(stats.groupPending)}`,
      ].join('\n'),
      inline: false,
    })

    // ── Session / cookie ────────────────────────────────────────────────────
    .addFields({
      name: '🍪  Cookie Status',
      value: stats.cookieSecurity,
      inline: true,
    })

    // ── Footer ──────────────────────────────────────────────────────────────
    .setFooter({
      text: `Requested by ${requester.tag}  •  logged.tg`,
      iconURL: requester.displayAvatarURL({ dynamic: true }),
    })
    .setTimestamp(now);

  return embed;
}

// ── Event: ready ──────────────────────────────────────────────────────────────

client.once('ready', () => {
  console.log(`[logged.tg bot] Logged in as ${client.user.tag}`);
  client.user.setActivity('logged.tg/dashboard', { type: ActivityType.Watching });
});

// ── Event: messageCreate ──────────────────────────────────────────────────────

client.on('messageCreate', async (message) => {
  // Ignore bots and DMs
  if (message.author.bot)    return;
  if (!message.guild)        return;

  const content = message.content.trim().toLowerCase();

  if (!content.startsWith(PREFIX)) return;

  const command = content.slice(PREFIX.length).split(/\s+/)[0];

  // ── !stats ──────────────────────────────────────────────────────────────
  if (command === 'stats') {
    // Optional: restrict to a specific channel
    if (STATS_CHANNEL && message.channel.id !== STATS_CHANNEL) return;

    const typing = await message.channel.sendTyping();

    try {
      const stats = await fetchStats();
      const embed = buildStatsEmbed(stats, message.author);
      await message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('[logged.tg bot] Error fetching stats:', err.message);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle('❌  Failed to fetch stats')
            .setDescription(
              `\`\`\`\n${err.message.slice(0, 300)}\`\`\`\n` +
              'Make sure your `LOGGED_TG_SESSION_COOKIE` is valid and not expired.',
            )
            .setTimestamp(),
        ],
      });
    }

    return;
  }

  // ── !help ────────────────────────────────────────────────────────────────
  if (command === 'help') {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('📖  logged.tg Bot — Commands')
          .addFields(
            { name: '`!stats`', value: 'Fetch live stats from your logged.tg dashboard', inline: false },
            { name: '`!help`',  value: 'Show this help message', inline: false },
          )
          .setTimestamp(),
      ],
    });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

if (!DISCORD_TOKEN) {
  console.error('[logged.tg bot] Missing DISCORD_BOT_TOKEN in environment');
  process.exit(1);
}
if (!LOGGED_SESSION) {
  console.error('[logged.tg bot] Missing LOGGED_TG_SESSION_COOKIE in environment');
  process.exit(1);
}

client.login(DISCORD_TOKEN);
