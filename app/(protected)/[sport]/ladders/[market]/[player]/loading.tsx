export default function Loading() {
  return (
    <div className="p-4" aria-busy="true" aria-live="polite">
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-56 rounded bg-gray-200 dark:bg-slate-800" />

        <div className="rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="grid grid-cols-8 gap-0 bg-gray-50 dark:bg-slate-900/40 p-3">
            <div className="h-4 rounded bg-gray-200 dark:bg-slate-800" />
            <div className="h-4 rounded bg-gray-200 dark:bg-slate-800" />
            <div className="h-4 rounded bg-gray-200 dark:bg-slate-800" />
            <div className="h-4 rounded bg-gray-200 dark:bg-slate-800" />
            <div className="h-4 rounded bg-gray-200 dark:bg-slate-800" />
            <div className="h-4 rounded bg-gray-200 dark:bg-slate-800" />
            <div className="h-4 rounded bg-gray-200 dark:bg-slate-800" />
            <div className="h-4 rounded bg-gray-200 dark:bg-slate-800" />
          </div>
          <div className="divide-y divide-gray-200 dark:divide-slate-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-8 gap-0 p-3">
                <div className="h-4 rounded bg-gray-200 dark:bg-slate-800" />
                <div className="h-4 rounded bg-gray-200 dark:bg-slate-800" />
                <div className="h-4 rounded bg-gray-200 dark:bg-slate-800" />
                <div className="h-4 rounded bg-gray-200 dark:bg-slate-800" />
                <div className="h-4 rounded bg-gray-200 dark:bg-slate-800" />
                <div className="h-4 rounded bg-gray-200 dark:bg-slate-800" />
                <div className="h-4 rounded bg-gray-200 dark:bg-slate-800" />
                <div className="h-4 rounded bg-gray-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


