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
            Type <code className="bg-white/10 px-1.5 py-0.5 rounded text-white">!stats</code> in your server to pull live dashboard data
          </p>
        </div>

        {/* Setup card */}
        <div className="bg-[#1a1d27] border border-white/10 rounded-xl divide-y divide-white/10">

          {/* Step 1 */}
          <div className="p-5 space-y-2">
            <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">Step 1 — Discord Bot Token</p>
            <p className="text-gray-300 text-sm">
              Go to{' '}
              <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer"
                className="text-[#5865f2] hover:underline">discord.com/developers/applications</a>,
              create a new application, add a Bot, enable <strong>Message Content Intent</strong>,
              then copy the token.
            </p>
            <pre className="bg-black/30 rounded-lg p-3 text-xs text-green-400 overflow-x-auto">
DISCORD_BOT_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</pre>
          </div>

          {/* Step 2 */}
          <div className="p-5 space-y-2">
            <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">Step 2 — logged.tg Session Cookie</p>
            <p className="text-gray-300 text-sm">
              Log into <a href="https://logged.tg" target="_blank" rel="noopener noreferrer"
                className="text-[#5865f2] hover:underline">logged.tg</a>,
              open DevTools → Application → Cookies → <code className="bg-white/10 px-1 rounded">logged.tg</code>,
              copy all cookie key=value pairs and paste them as one line:
            </p>
            <pre className="bg-black/30 rounded-lg p-3 text-xs text-green-400 overflow-x-auto whitespace-pre-wrap">
{`LOGGED_TG_SESSION_COOKIE=__Secure-next-auth.session-token=abc123; other-cookie=xyz`}</pre>
          </div>

          {/* Step 3 */}
          <div className="p-5 space-y-2">
            <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">Step 3 — Run the Bot</p>
            <p className="text-gray-300 text-sm">
              Fill in <code className="bg-white/10 px-1 rounded">.env.local</code> then run:
            </p>
            <pre className="bg-black/30 rounded-lg p-3 text-xs text-green-400 overflow-x-auto">
{`# Production
pnpm bot

# Development (auto-restarts on save)
pnpm bot:dev`}</pre>
          </div>

        </div>

        {/* Commands */}
        <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-5 space-y-3">
          <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">Commands</p>
          <div className="space-y-2">
            {[
              ['!stats', 'Fetch live stats from your logged.tg dashboard and post a rich embed'],
              ['!help',  'Show available commands'],
            ].map(([cmd, desc]) => (
              <div key={cmd} className="flex gap-4 items-start">
                <code className="shrink-0 bg-[#5865f2]/20 text-[#5865f2] px-2 py-0.5 rounded text-sm">{cmd}</code>
                <span className="text-gray-400 text-sm">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats preview */}
        <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-5 space-y-3">
          <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">Embed Preview — Stats Shown</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              '🎯 Total Hits',
              '🌐 Site Visits',
              '💰 Total Summary',
              '💎 Total RAP',
              '💵 Balance',
              '🏆 Limiteds RAP',
              '🦴 Korblox / Headless',
              '🔔 Subscription Status',
              '🧾 Billing & Credit',
              '👥 Groups Owned',
              '🍪 Cookie Status',
              '⭐ Premium Badge',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5865f2] shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs">
          Bot source: <code>bot/index.js</code> — runs standalone, separate from the Next.js app
        </p>
      </div>
    </main>
  );
}
