import { CheckCircle2, Bot, Eye } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f1117] text-white font-mono flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1 text-green-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            Ready to run
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            logged.tg Stats Bot
          </h1>
          <p className="text-gray-400 text-sm">
            Type{" "}
            <code className="bg-white/10 px-1.5 py-0.5 rounded text-white">!stats</code>{" "}
            in your server to pull live dashboard data
          </p>
        </div>

        {/* Status */}
        <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-5 space-y-3">
          <p className="text-xs text-green-400 font-semibold uppercase tracking-widest">
            Environment Variables
          </p>
          {[
            "DISCORD_BOT_TOKEN",
            "LOGGED_TG_SESSION_COOKIE",
          ].map((key) => (
            <div key={key} className="flex items-center gap-2.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              <code className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-green-300 text-xs">
                {key}
              </code>
              <span className="text-gray-500 text-xs">set</span>
            </div>
          ))}
        </div>

        {/* Steps to run */}
        <div className="bg-[#1a1d27] border border-white/10 rounded-xl divide-y divide-white/10">

          <div className="p-5 space-y-2">
            <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">
              Step 1 — Download the project
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              Click the <strong className="text-white">three dots (•••)</strong> in the top-right of this page and select{" "}
              <strong className="text-white">Download ZIP</strong>.
            </p>
          </div>

          <div className="p-5 space-y-2">
            <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">
              Step 2 — Install dependencies
            </p>
            <pre className="bg-black/40 rounded-lg p-3 text-xs text-green-400">pnpm install</pre>
          </div>

          <div className="p-5 space-y-2">
            <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">
              Step 3 — Enable Message Content Intent
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
              </a>{" "}
              → your app → <strong className="text-white">Bot</strong> → scroll down → toggle on{" "}
              <strong className="text-white">Message Content Intent</strong>. Save changes.
            </p>
          </div>

          <div className="p-5 space-y-2">
            <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">
              Step 4 — Invite the bot to your server
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              In the Developer Portal go to <strong className="text-white">OAuth2 → URL Generator</strong>,
              select <strong className="text-white">bot</strong> scope, tick{" "}
              <strong className="text-white">Send Messages</strong> and{" "}
              <strong className="text-white">Read Message History</strong>,
              then open the generated URL to invite the bot.
            </p>
          </div>

          <div className="p-5 space-y-2">
            <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">
              Step 5 — Start the bot
            </p>
            <pre className="bg-black/40 rounded-lg p-3 text-xs text-green-400">{`pnpm bot`}</pre>
            <p className="text-gray-500 text-xs">
              Use <code className="text-gray-400">pnpm bot:dev</code> during development — it auto-restarts on file save.
            </p>
          </div>

          <div className="p-5 space-y-2">
            <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">
              Step 6 — Use it
            </p>
            <p className="text-gray-300 text-sm">Type in any channel in your server:</p>
            <pre className="bg-black/40 rounded-lg p-3 text-xs text-green-400">!stats</pre>
          </div>
        </div>

        {/* Commands */}
        <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-5 space-y-3">
          <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">Commands</p>
          <div className="space-y-2">
            {[
              ["!stats", "Fetch live stats from your logged.tg dashboard"],
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

        {/* Stats shown */}
        <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-5 space-y-3">
          <p className="text-xs text-[#5865f2] font-semibold uppercase tracking-widest">
            Stats Shown in Embed
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
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
              <div key={item} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5865f2] shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Cookie warning */}
        <div className="flex gap-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
          <Eye className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-yellow-400 text-xs font-semibold">Session cookie expires on logout</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              If <code className="bg-white/10 px-1 rounded">!stats</code> stops working, your{" "}
              <code className="bg-white/10 px-1 rounded">LOGGED_TG_SESSION_COOKIE</code> has expired.
              Grab a fresh one from your browser while logged into logged.tg and update the env var.
            </p>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs">
          Bot source: <code className="text-gray-500">bot/index.js</code> — runs standalone, separate from the Next.js app
        </p>

      </div>
    </main>
  )
}
