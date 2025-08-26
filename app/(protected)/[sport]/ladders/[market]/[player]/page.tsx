"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { marketSlugToKey } from "@/lib/ladder/market-slugs"

export default function LadderPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const { sport, marketSlug, playerSlug } = useMemo(() => {
    const parts = (pathname || "").split("/").filter(Boolean)
    // .../[sport]/ladders/[market]/[player]
    const sport = parts[1]
    const marketSlug = parts[3]
    const playerSlug = parts[4]
    return { sport, marketSlug, playerSlug }
  }, [pathname])

  const books = searchParams.get("books") || ""
  const eventId = searchParams.get("event_id") || ""

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        setData(null)
        if (!sport || !marketSlug || !playerSlug) return

        const playerName = decodeURIComponent(playerSlug.replace(/-/g, " "))
        const marketKey = marketSlugToKey(sport, marketSlug)
        const qs = new URLSearchParams({ league: sport, player: playerName, market: marketKey })
        if (books) qs.set("books", books)
        if (eventId) qs.set("event_id", eventId)
        const res = await fetch(`/api/ladder?${qs.toString()}`)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err?.error || `Request failed: ${res.status}`)
        }
        const json = await res.json()
        setData(json)
      } catch (e: any) {
        setError(e?.message || "Failed to load ladder")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [sport, marketSlug, playerSlug, books, eventId])

  if (loading) return <div className="p-4">Loading ladder…</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>
  if (!data) return <div className="p-4">No data</div>

  return (
    <div className="p-4 space-y-4">
      <div className="text-xl font-semibold">
        {data.player?.name} — {marketSlug.replace(/-/g, " ")} ({sport?.toUpperCase()})
      </div>
      <div className="text-sm text-slate-500">Key: {data.key}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-2 text-left">Line</th>
              <th className="p-2 text-left">Best Over</th>
              <th className="p-2 text-left">Best Under</th>
              <th className="p-2 text-left">Avg Over</th>
              <th className="p-2 text-left">Avg Under</th>
              <th className="p-2 text-left">EV Over%</th>
              <th className="p-2 text-left">EV Under%</th>
              <th className="p-2 text-left">Books (count)</th>
            </tr>
          </thead>
          <tbody>
            {data.lines?.map((r: any) => (
              <tr key={r.line} className="border-t">
                <td className="p-2 font-medium">{r.line}</td>
                <td className="p-2">{r.best_over ? `${r.best_over.book} ${r.best_over.price}` : '-'}</td>
                <td className="p-2">{r.best_under ? `${r.best_under.book} ${r.best_under.price}` : '-'}</td>
                <td className="p-2">{r.avg_over_decimal ? r.avg_over_decimal.toFixed(2) : '-'}</td>
                <td className="p-2">{r.avg_under_decimal ? r.avg_under_decimal.toFixed(2) : '-'}</td>
                <td className="p-2">{r.ev_over_pct != null ? r.ev_over_pct.toFixed(2) : '-'}</td>
                <td className="p-2">{r.ev_under_pct != null ? r.ev_under_pct.toFixed(2) : '-'}</td>
                <td className="p-2">{r.books ? Object.keys(r.books).length : 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
