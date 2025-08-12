import { useMemo } from "react"
import type { GameOdds } from "@/types/game-lines"

export type GameLinesSortField = "time" | "home" | "away" | "odds" | "ev"
export type SortDirection = "asc" | "desc"

export interface UseTransformedGameLinesParams {
  data: GameOdds[] | undefined
  market: string
  globalLine: string | null
  searchQuery: string
  selectedGames: string[] | null
  sportsbookFilter: string | null
  sortField: GameLinesSortField
  sortDirection: SortDirection
}

export interface TransformedGameOdds extends GameOdds {
  activeLine: string
  best: {
    home?: { price: number; book: string; link?: string }
    away?: { price: number; book: string; link?: string }
    over?: { price: number; book: string; link?: string }
    under?: { price: number; book: string; link?: string }
  }
  average: {
    home?: number
    away?: number
    over?: number
    under?: number
  }
  evPct: {
    home?: number | null
    away?: number | null
    over?: number | null
    under?: number | null
  }
}

export interface UseTransformedGameLinesResult {
  processedData: TransformedGameOdds[]
  filteredData: TransformedGameOdds[]
  sortedData: TransformedGameOdds[]
  availableLines: string[]
  availableGames: Array<{ event_id: string; home_team: string; away_team: string; commence_time: string }>
  totalCount: number
  filteredCount: number
}

export function useTransformedGameLinesData({
  data,
  market,
  globalLine,
  searchQuery,
  selectedGames,
  sportsbookFilter,
  sortField,
  sortDirection,
}: UseTransformedGameLinesParams): UseTransformedGameLinesResult {
  const processedData = useMemo<TransformedGameOdds[]>(() => {
    if (!data) return []

    const americanToDecimal = (odds: number) => (odds >= 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1)
    const decimalToAmerican = (dec: number) => (dec >= 2 ? Math.round((dec - 1) * 100) : Math.round(-100 / (dec - 1)))
    const calcAvgAmerican = (prices: number[]) => {
      if (!prices.length) return undefined
      const dec = prices.reduce((s, p) => s + americanToDecimal(p), 0) / prices.length
      return decimalToAmerican(dec)
    }
    const calcEV = (best?: number, avg?: number): number | null => {
      if (!best || !avg) return null
      const bestD = americanToDecimal(best)
      const avgD = americanToDecimal(avg)
      const trueProb = 1 / avgD
      return Math.round(((trueProb * bestD - 1) * 100) * 10) / 10
    }

    const isTotals = market === "total" || market.includes("total")
    const isSpreads =
      market === "spread" ||
      market.includes("spread") ||
      market === "run_line" ||
      market === "puck_line"
    const isMoneyline = !isTotals && !isSpreads

    return data.map((g) => {
      const activeLine = (globalLine ?? g.primary_line ?? "standard").toString()

      const best: TransformedGameOdds["best"] = {}
      const average: TransformedGameOdds["average"] = {}

      if (isMoneyline) {
        const home: Array<{ price: number; book: string; link?: string }> = []
        const away: Array<{ price: number; book: string; link?: string }> = []
        g.bookmakers.forEach((b) => {
          const m = b.markets.find((mm) => mm.key === "h2h")
          if (!m) return
          const h = m.outcomes.find((o) => o.name.toLowerCase() === g.home_team.name.toLowerCase())
          const a = m.outcomes.find((o) => o.name.toLowerCase() === g.away_team.name.toLowerCase())
          if (h) home.push({ price: h.price, book: b.key, link: h.link })
          if (a) away.push({ price: a.price, book: b.key, link: a.link })
        })

        const pick = (arr: Array<{ price: number; book: string; link?: string }>) =>
          arr.reduce<typeof arr[number] | undefined>((best, cur) => (!best || cur.price > best.price ? cur : best), undefined)

        best.home = pick(home)
        best.away = pick(away)
        average.home = calcAvgAmerican(home.map((p) => p.price))
        average.away = calcAvgAmerican(away.map((p) => p.price))
      } else if (isTotals) {
        // totals
        const over: Array<{ price: number; book: string; link?: string }> = []
        const under: Array<{ price: number; book: string; link?: string }> = []

        // Compute consensus totals point across books for this game
        const consensusPoint = (() => {
          const countStandard: Record<string, number> = {}
          const countPresence: Record<string, number> = {}
          g.bookmakers.forEach((b) => {
            const m = b.markets.find((mm) => mm.key === "totals")
            if (!m?.lines) return
            Object.values<any>(m.lines).forEach((ld) => {
              const key = String(ld.point)
              let anyStandard = false
              for (const sb of Object.values<any>(ld.sportsbooks || {})) {
                countPresence[key] = (countPresence[key] || 0) + 1
                if (sb?.is_standard) anyStandard = true
              }
              if (anyStandard) countStandard[key] = (countStandard[key] || 0) + 1
            })
          })
          // Prefer point with most is_standard counts; fallback to most presence
          const pickMaxKey = (counts: Record<string, number>) =>
            Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k]) => k)[0]
          const stdKey = pickMaxKey(countStandard)
          if (stdKey) return stdKey
          const presKey = pickMaxKey(countPresence)
          return presKey
        })()

        g.bookmakers.forEach((b) => {
          const m = b.markets.find((mm) => mm.key === "totals")
          if (!m?.lines) return

          let selectedLineData: any | undefined

          if (globalLine) {
            // Explicit user-selected line: require point match and sportsbook entry
            for (const [, ld] of Object.entries<any>(m.lines)) {
              if (String(ld.point) === String(activeLine) && ld.sportsbooks?.[b.key]) {
                selectedLineData = ld
                break
              }
            }
          } else {
            // No explicit line: prefer this book's standard line
            for (const [, ld] of Object.entries<any>(m.lines)) {
              if (ld.sportsbooks?.[b.key]?.is_standard) {
                selectedLineData = ld
                break
              }
            }
            // Fallback: consensus point used by majority of books
            if (!selectedLineData && consensusPoint != null) {
              for (const [, ld] of Object.entries<any>(m.lines)) {
                if (String(ld.point) === String(consensusPoint) && ld.sportsbooks?.[b.key]) {
                  selectedLineData = ld
                  break
                }
              }
            }
            // Fallback: use game's primary_line if it exists for this book
            if (!selectedLineData && g.primary_line != null) {
              for (const [, ld] of Object.entries<any>(m.lines)) {
                if (String(ld.point) === String(g.primary_line) && ld.sportsbooks?.[b.key]) {
                  selectedLineData = ld
                  break
                }
              }
            }
          }

          if (!selectedLineData) return
          const sb = selectedLineData.sportsbooks?.[b.key]
          if (sb?.over) over.push({ price: sb.over.price, book: b.key, link: sb.over.link })
          if (sb?.under) under.push({ price: sb.under.price, book: b.key, link: sb.under.link })
        })

        const pick = (arr: Array<{ price: number; book: string; link?: string }>) =>
          arr.reduce<typeof arr[number] | undefined>((best, cur) => (!best || cur.price > best.price ? cur : best), undefined)

        best.over = pick(over)
        best.under = pick(under)
        average.over = calcAvgAmerican(over.map((p) => p.price))
        average.under = calcAvgAmerican(under.map((p) => p.price))
      } else if (isSpreads) {
        // spreads -> derive home/away from lines map using team name
        const homeArr: Array<{ price: number; book: string; link?: string }> = []
        const awayArr: Array<{ price: number; book: string; link?: string }> = []
        const activeAbs = Number.isFinite(Number(activeLine)) ? Math.abs(Number(activeLine)) : NaN

        // Compute consensus spread absolute point across books
        const consensusAbsPoint = (() => {
          const countStandard: Record<string, number> = {}
          const countPresence: Record<string, number> = {}
          g.bookmakers.forEach((b) => {
            const m = b.markets.find((mm) => mm.key === "spreads")
            if (!m?.lines) return
            Object.values<any>(m.lines).forEach((ld) => {
              const key = String(Math.abs(Number(ld.point)))
              let anyStandard = false
              for (const sb of Object.values<any>(ld.sportsbooks || {})) {
                countPresence[key] = (countPresence[key] || 0) + 1
                if (sb?.is_standard) anyStandard = true
              }
              if (anyStandard) countStandard[key] = (countStandard[key] || 0) + 1
            })
          })
          const pickMaxKey = (counts: Record<string, number>) =>
            Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k]) => k)[0]
          const stdKey = pickMaxKey(countStandard)
          if (stdKey) return stdKey
          return pickMaxKey(countPresence)
        })()

        g.bookmakers.forEach((b) => {
          const m = b.markets.find((mm) => mm.key === "spreads")
          if (!m?.lines) return

          // Collect candidate line entries for this bookmaker
          const entries = Object.entries(m.lines).filter(([, lineData]) => {
            const isAbsMatch = String(Math.abs(Number(lineData.point))) === String(activeAbs)
            const hasBook = !!lineData.sportsbooks?.[b.key]
            const isStd = !!lineData.sportsbooks?.[b.key]?.is_standard
            if (globalLine) return isAbsMatch && hasBook
            // No explicit line: prefer is_standard, else consensus abs point if present for this book
            if (isStd) return true
            if (consensusAbsPoint != null) {
              return String(Math.abs(Number(lineData.point))) === String(consensusAbsPoint) && hasBook
            }
            return false
          })

          if (entries.length === 0) return

          // For each matched entry, push the price into the correct side based on team
          for (const [, lineData] of entries) {
            const sb = lineData.sportsbooks?.[b.key] as any
            if (!sb) continue
            const teamName = (sb.team || "").toString().toLowerCase()
            if (!teamName) continue
            if (teamName === g.home_team.name.toLowerCase()) {
              if (typeof sb.price === "number") homeArr.push({ price: sb.price, book: b.key, link: sb.link })
            } else if (teamName === g.away_team.name.toLowerCase()) {
              if (typeof sb.price === "number") awayArr.push({ price: sb.price, book: b.key, link: sb.link })
            }
          }
        })

        const pick = (arr: Array<{ price: number; book: string; link?: string }>) =>
          arr.reduce<typeof arr[number] | undefined>((best, cur) => (!best || cur.price > best.price ? cur : best), undefined)

        best.home = pick(homeArr)
        best.away = pick(awayArr)
        average.home = calcAvgAmerican(homeArr.map((p) => p.price))
        average.away = calcAvgAmerican(awayArr.map((p) => p.price))
      }

      const evPct: TransformedGameOdds["evPct"] = {
        home: isMoneyline ? calcEV(best.home?.price, average.home) : undefined,
        away: isMoneyline ? calcEV(best.away?.price, average.away) : undefined,
        over: isMoneyline ? undefined : calcEV(best.over?.price, average.over),
        under: isMoneyline ? undefined : calcEV(best.under?.price, average.under),
      }

      return { ...g, activeLine, best, average, evPct }
    })
  }, [data, market, globalLine])

  const availableGames = useMemo(
    () =>
      processedData.map((g) => ({
        event_id: g.event_id,
        home_team: g.home_team.name,
        away_team: g.away_team.name,
        commence_time: g.commence_time,
      })),
    [processedData],
  )

  const availableLines = useMemo(() => {
    const isTotals = market === "total" || market.includes("total")
    const isSpreads = market === "spread" || market.includes("spread")
    if (!isTotals && !isSpreads) return []
    const set = new Set<string>()
    processedData.forEach((g) => {
      g.bookmakers.forEach((b) => {
        const key = isTotals ? "totals" : "spreads"
        const m = b.markets.find((mm) => mm.key === key)
        if (m?.lines) {
          if (isTotals) {
            Object.values(m.lines).forEach((ld) => set.add(String(ld.point)))
          } else {
            // spreads -> dedupe by absolute value
            Object.values(m.lines).forEach((ld) => set.add(String(Math.abs(Number(ld.point)))))
          }
        } else if (m?.outcomes?.length) {
          // Fallback: collect points from outcomes if provided
          m.outcomes.forEach((o: any) => {
            if (typeof o.point === "number") set.add(String(o.point))
          })
        }
      })
    })
    return Array.from(set).sort((a, b) => Number(a) - Number(b))
  }, [processedData, market])

  const filteredData = useMemo(() => {
    return processedData.filter((g) => {
      if (selectedGames?.length && !selectedGames.includes(g.event_id)) return false
      if (searchQuery) {
        const s = searchQuery.toLowerCase()
        const match = g.home_team.name.toLowerCase().includes(s) || g.away_team.name.toLowerCase().includes(s)
        if (!match) return false
      }
      if (sportsbookFilter) {
        const sb = sportsbookFilter.toLowerCase()
        const any = g.bookmakers.some((b) => b.key.toLowerCase() === sb)
        if (!any) return false
      }
      return true
    })
  }, [processedData, searchQuery, selectedGames, sportsbookFilter])

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (sortField === "time") {
        const A = new Date(a.commence_time).getTime()
        const B = new Date(b.commence_time).getTime()
        return sortDirection === "asc" ? A - B : B - A
      }
      if (sortField === "home") {
        const A = a.home_team.name
        const B = b.home_team.name
        return sortDirection === "asc" ? A.localeCompare(B) : B.localeCompare(A)
      }
      if (sortField === "away") {
        const A = a.away_team.name
        const B = b.away_team.name
        return sortDirection === "asc" ? A.localeCompare(B) : B.localeCompare(A)
      }
      if (sortField === "odds") {
        const A = a.best.home?.price ?? -Infinity
        const B = b.best.home?.price ?? -Infinity
        return sortDirection === "asc" ? A - B : B - A
      }
      if (sortField === "ev") {
        const maxA = Math.max(
          a.evPct.home ?? -Infinity,
          a.evPct.away ?? -Infinity,
          a.evPct.over ?? -Infinity,
          a.evPct.under ?? -Infinity,
        )
        const maxB = Math.max(
          b.evPct.home ?? -Infinity,
          b.evPct.away ?? -Infinity,
          b.evPct.over ?? -Infinity,
          b.evPct.under ?? -Infinity,
        )
        return sortDirection === "asc" ? maxA - maxB : maxB - maxA
      }
      return 0
    })
  }, [filteredData, sortField, sortDirection])

  return {
    processedData,
    filteredData,
    sortedData,
    availableLines,
    availableGames,
    totalCount: data?.length || 0,
    filteredCount: filteredData.length,
  }
}


