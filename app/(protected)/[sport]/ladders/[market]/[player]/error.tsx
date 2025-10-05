"use client"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="p-4">
      <div className="text-red-600 font-semibold mb-2">Something went wrong</div>
      <div className="text-sm text-red-700 mb-4">{error?.message || "Failed to load ladder."}</div>
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-red-50 border-red-300 text-red-700"
      >
        Try again
      </button>
    </div>
  )
}


