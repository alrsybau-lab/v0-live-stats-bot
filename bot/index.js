require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  ActivityType,
  ChannelType,
} = require("discord.js");
const OpenAI = require("openai");

// ── Config ──────────────────────────────────────────────────────────────────────
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const OPENAI_KEY    = process.env.OPENAI_API_KEY;
const PREFIX        = "!";

const openai = new OpenAI({ apiKey: OPENAI_KEY });

// ── Helpers ─────────────────────────────────────────────────────────────────────

/**
 * Build a plain-text summary of every channel and category in the guild,
 * including channel topics and any button/link-style URLs found in pinned messages.
 */
async function buildServerContext(guild) {
  const lines = [`Server: ${guild.name}`];

  // Collect all channels sorted by position
  const channels = [...guild.channels.cache.values()].sort(
    (a, b) => a.position - b.position
  );

  for (const ch of channels) {
    if (ch.type === ChannelType.GuildCategory) {
      lines.push(`\nCategory: ${ch.name}`);
      continue;
    }

    if (
      ch.type === ChannelType.GuildText ||
      ch.type === ChannelType.GuildAnnouncement ||
      ch.type === ChannelType.GuildForum
    ) {
      const mention = `<#${ch.id}>`;
      const topic   = ch.topic ? ` — "${ch.topic}"` : "";
      lines.push(`  #${ch.name} (mention: ${mention})${topic}`);

      // Collect URLs from pinned messages (buttons / embeds often have links)
      try {
        const pins = await ch.messages.fetchPinned().catch(() => null);
        if (pins) {
          const urls = new Set();
          for (const msg of pins.values()) {
            // Grab URLs from message content
            const found = msg.content.match(/https?:\/\/[^\s>]+/g) || [];
            found.forEach((u) => urls.add(u));
            // Grab URLs from embeds
            for (const embed of msg.embeds) {
              if (embed.url)          urls.add(embed.url);
              if (embed.description) {
                const eu = embed.description.match(/https?:\/\/[^\s>]+/g) || [];
                eu.forEach((u) => urls.add(u));
              }
              for (const field of embed.fields ?? []) {
                const fu = field.value.match(/https?:\/\/[^\s>]+/g) || [];
                fu.forEach((u) => urls.add(u));
              }
            }
            // Grab URLs from action row buttons
            for (const row of msg.components ?? []) {
              for (const component of row.components ?? []) {
                if (component.url) urls.add(component.url);
              }
            }
          }
          if (urls.size > 0) {
            lines.push(`    Links in pins: ${[...urls].join(", ")}`);
          }
        }
      } catch {
        // ignore channels we can't read
      }
    }
  }

  return lines.join("\n");
}

/**
 * Ask OpenAI with server context injected as system prompt.
 */
async function askAI(question, serverContext) {
  const systemPrompt = `You are a helpful assistant for a Discord server. 
When a user asks about a channel, always mention it using its Discord mention format like <#CHANNEL_ID> so it becomes a clickable link.
When a user asks about a website or link that exists in the server, provide the URL directly.
Keep answers concise and friendly. Do NOT use embeds or markdown headers. Plain text only.
Here is everything you know about this server's channels and links:

${serverContext}`;

  const completion = await openai.chat.completions.create({
    model:    "gpt-4o-mini",
    messages: [
      { role: "system",  content: systemPrompt },
      { role: "user",    content: question     },
    ],
    max_tokens: 500,
  });

  return completion.choices[0]?.message?.content?.trim() ?? "Sorry, I couldn't generate a response.";
}

// ── Discord client ──────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`[bot] Online as ${client.user.tag}`);
  client.user.setActivity("!ask <question>", { type: ActivityType.Listening });
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild)     return;

  const content = message.content.trim();
  if (!content.toLowerCase().startsWith(`${PREFIX}ask`)) return;

  // Extract question after !ask
  const question = content.slice(PREFIX.length + 3).trim();

  if (!question) {
    await message.reply("Please provide a question. Usage: `!ask where is the hyperlink channel?`");
    return;
  }

  await message.channel.sendTyping();

  try {
    const serverContext = await buildServerContext(message.guild);
    const answer        = await askAI(question, serverContext);
    await message.reply(answer);
  } catch (err) {
    console.error("[bot] !ask error:", err.message);
    await message.reply("Something went wrong while answering your question. Please try again.");
  }
});

// ── Start ───────────────────────────────────────────────────────────────────────

if (!DISCORD_TOKEN) {
  console.error("[bot] DISCORD_BOT_TOKEN is not set.");
  process.exit(1);
}

if (!OPENAI_KEY) {
  console.error("[bot] OPENAI_API_KEY is not set.");
  process.exit(1);
}

client.login(DISCORD_TOKEN);
