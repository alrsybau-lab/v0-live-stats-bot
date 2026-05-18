export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f1117] text-white font-mono flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#5865f2]/10 border border-[#5865f2]/30 rounded-full px-4 py-1 text-[#5865f2] text-sm">
            <span className="w-2 h-2 rounded-full bg-[#5865f2] animate-pulse inline-block" />
            Discord Bot
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            logged.tg Stats Bot
          </h1>
          <p className="text-gray-400 text-sm">
            Type{" "}
            <code className="bg-white/10 px-1.5 py-0.5 rounded text-white">
              !stats
            </code>{" "}
            in your server to pull live dashboard data
          </p>
        </div>

        {/* Setup steps */}
        <div className="bg-[#1a1d27] border border-white/10 rounded-xl divide-y divide-white/10">

          {/* Step 1 */}
          <div className="p-5 space-y-2">
            <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">
              Step 1 — Discord Bot Token
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              Go to{" "}
              <a
                href="https://discord.com/developers/applications"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5865f2] hover:underline"
              >
                discord.com/developers/applications
              </a>
              , create a new application, add a Bot, enable{" "}
              <strong className="text-white">Message Content Intent</strong>,
              then copy the token.
            </p>
            <pre className="bg-black/40 rounded-lg p-3 text-xs text-green-400 overflow-x-auto">
              DISCORD_BOT_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxx
            </pre>
          </div>

          {/* Step 2 */}
          <div className="p-5 space-y-2">
            <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">
              Step 2 — logged.tg Session Cookie
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              Log into{" "}
              <a
                href="https://logged.tg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5865f2] hover:underline"
              >
                logged.tg
              </a>
              , open DevTools{" "}
              <kbd className="bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-xs">
                F12
              </kbd>{" "}
              then go to{" "}
              <strong className="text-white">
                Network &rarr; any request &rarr; Request Headers &rarr; Cookie
              </strong>
              . Copy the full cookie string and paste it as one line:
            </p>
            <pre className="bg-black/40 rounded-lg p-3 text-xs text-green-400 overflow-x-auto whitespace-pre-wrap break-all">
              {`LOGGED_TG_SESSION_COOKIE=__Secure-next-auth.session-token=abc123; other=xyz`}
            </pre>
          </div>

          {/* Step 3 */}
          <div className="p-5 space-y-2">
            <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">
              Step 3 — Invite the Bot
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              In the Developer Portal go to{" "}
              <strong className="text-white">OAuth2 &rarr; URL Generator</strong>,
              select <strong className="text-white">bot</strong> scope, then tick{" "}
              <strong className="text-white">Send Messages</strong> and{" "}
              <strong className="text-white">Read Message History</strong>.
              Paste the generated URL in your browser to invite the bot to your server.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-5 space-y-2">
            <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">
              Step 4 — Run the Bot
            </p>
            <p className="text-gray-300 text-sm">
              Fill in{" "}
              <code className="bg-white/10 px-1 rounded">.env.local</code> with
              your tokens, then start the bot:
            </p>
            <pre className="bg-black/40 rounded-lg p-3 text-xs text-green-400 overflow-x-auto">{`# Production
pnpm bot

# Development (auto-restarts on file save)
pnpm bot:dev`}</pre>
          </div>
        </div>

        {/* Commands */}
        <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-5 space-y-3">
          <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">
            Commands
          </p>
          <div className="space-y-2">
            {[
              ["!stats", "Fetch live stats from your logged.tg dashboard and post a rich embed"],
              ["!help",  "Show available commands"],
            ].map(([cmd, desc]) => (
              <div key={cmd} className="flex gap-4 items-start">
                <code className="shrink-0 bg-[#5865f2]/20 text-[#5865f2] px-2 py-0.5 rounded text-sm">
                  {cmd}
                </code>
                <span className="text-gray-400 text-sm">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats that get shown */}
        <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-5 space-y-3">
          <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">
            Stats Shown in Embed
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {[
              "Total Hits",
              "Site Visits",
              "Total Summary",
              "Total RAP",
              "Balance",
              "Limiteds RAP",
              "Korblox / Headless",
              "Subscription Status",
              "Billing & Credit",
              "Groups Owned",
              "Cookie Status",
              "Premium Badge",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5865f2] shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs">
          Bot source:{" "}
          <code className="text-gray-500">bot/index.js</code> — runs
          standalone, separate from the Next.js app
        </p>
      </div>
    </main>
  );
}
