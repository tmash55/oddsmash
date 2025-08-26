const MARKET_SLUGS: Record<string, Record<string, string>> = {
  mlb: {
    "home-runs": "home runs",
    "total-bases": "total bases",
    "hits": "hits",
    "rbis": "rbis",
    "strikeouts": "strikeouts",
  },
  nfl: {
    "receiving-yards": "receiving yards",
    "receptions": "receptions",
    "rushing-yards": "rushing yards",
  },
  nba: {
    "points": "points",
    "rebounds": "rebounds",
    "assists": "assists",
  },
}

export function marketSlugToKey(sport: string, slug: string): string {
  const league = (sport || "").toLowerCase()
  const s = (slug || "").toLowerCase()
  return MARKET_SLUGS[league]?.[s] || s.replace(/-/g, " ")
}

export function marketKeyToSlug(sport: string, key: string): string {
  const league = (sport || "").toLowerCase()
  const k = (key || "").toLowerCase()
  // Try reverse lookup first
  const entries = Object.entries(MARKET_SLUGS[league] || {})
  for (const [slug, val] of entries) {
    if (val === k) return slug
  }
  return k.replace(/\s+/g, "-")
}



