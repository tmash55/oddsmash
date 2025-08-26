export function normalizeForSlug(input: string): string {
  return (input || "")
    .toLowerCase()
    .replace(/\&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function createGameSlug(homeTeam: string, awayTeam: string, commenceTime: string): string {
  const home = normalizeForSlug(homeTeam)
  const away = normalizeForSlug(awayTeam)
  let datePart = ""
  try {
    const d = new Date(commenceTime)
    if (!Number.isNaN(d.getTime())) {
      // Use UTC date for stability
      const year = d.getUTCFullYear()
      const month = String(d.getUTCMonth() + 1).padStart(2, "0")
      const day = String(d.getUTCDate()).padStart(2, "0")
      datePart = `${year}-${month}-${day}`
    }
  } catch {
    // Ignore invalid dates when generating slug date part
  }
  return [away, "vs", home, datePart].filter(Boolean).join("-")
}

export function isLikelySlug(value: string): boolean {
  // Heuristic: slugs contain dashes and at least one letter
  return /[a-z]/.test(value) && value.includes("-")
}


