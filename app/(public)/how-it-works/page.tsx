export default function HowItWorksPage() {
  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">How It Works</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-[85ch]">
          Guides and how‑tos are on the way. We&apos;re polishing a great experience for you.
        </p>
      </div>

      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 opacity-90" />
        <h2 className="text-xl font-semibold text-foreground">How‑tos coming soon</h2>
        <p className="mt-2 text-muted-foreground">We&apos;re building step‑by‑step tutorials for every tool.</p>
      </div>
    </div>
  )
}


