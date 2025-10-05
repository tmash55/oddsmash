## Game Lines Schemas and Normalization Plan

This document captures the backend schemas for spreads, totals, and h2h (moneyline), and proposes a normalization layer for the UI so switching markets stays seamless.

### Raw schemas

#### spreads

```json
{
  "market_key": "spreads",
  "market_label": "Spread",
  "market_type": "spread",
  "description": "Bet with a spread",
  "has_alternates": true,
  "lines": {
    "13.5": {
      "point": 13.5,
      "sportsbooks": {
        "draftkings": {
          "price": -115,
          "link": "https://sportsbook.draftkings.com/event/32299288?outcomes=0HC79948377P1350_3",
          "sid": "0HC79948377P1350_3",
          "is_standard": true,
          "team": "Ohio Bobcats"
        }
        // ... more books
      }
    },
    "-13.5": {
      "point": -13.5,
      "sportsbooks": {
        "draftkings": {
          "price": -105,
          "link": "https://sportsbook.draftkings.com/event/32299288?outcomes=0HC79948377N1350_1",
          "sid": "0HC79948377N1350_1",
          "is_standard": true,
          "team": "Rutgers Scarlet Knights"
        }
        // ... more books
      }
    }
    // ... additional alt lines (positive and negative)
  },
  "primary_line": "13.5",
  "event_id": "0340d587efabc6bbf7114392cb51dfd5",
  "sport_key": "americanfootball_ncaaf",
  "home_team": "Rutgers Scarlet Knights",
  "away_team": "Ohio Bobcats",
  "commence_time": "2025-08-28T22:00:00Z",
  "last_update": "2025-08-07T15:52:24.758866+00:00"
}
```

Key traits:
- Lines are keyed by stringified spread values; both positive and negative exist.
- Sportsbook entry includes `team`, which disambiguates which side the line belongs to.

#### totals

```json
{
  "market_key": "totals",
  "market_label": "Total Points",
  "market_type": "total",
  "description": "Combined points scored by both teams",
  "has_alternates": true,
  "lines": {
    "50.5": {
      "point": 50.5,
      "sportsbooks": {
        "draftkings": {
          "is_standard": true,
          "over": { "price": -105, "link": "https://...", "sid": "..." },
          "under": { "price": -115, "link": "https://...", "sid": "..." }
        }
        // ... more books
      }
    }
    // ... more alt totals
  },
  "primary_line": "50.5",
  "event_id": "03799e82b32ca4fb9dd248a037685d38",
  "sport_key": "americanfootball_ncaaf",
  "home_team": "Akron Zips",
  "away_team": "Wyoming Cowboys",
  "commence_time": "2025-08-28T23:00:00Z",
  "last_update": "2025-08-07T15:52:24.840888+00:00"
}
```

Key traits:
- Per-line sportsbook entries provide both `over` and `under` prices.

#### h2h (moneyline)

```json
{
  "market_key": "h2h",
  "market_label": "Moneyline",
  "market_type": "2_way",
  "description": "Pick the winner of the game",
  "has_alternates": false,
  "lines": {
    "0": {
      "point": null,
      "sportsbooks": {
        "fanduel": {
          "is_standard": true,
          "away_team": { "price": 245, "link": "https://...", "sid": "...", "team": "New York Giants" },
          "home_team": { "price": -300, "link": "https://...", "sid": "...", "team": "Washington Commanders" }
        }
        // ... more books
      }
    }
  },
  "primary_line": "0",
  "event_id": "4cce00ca468c67eca17a9a061f778fb2",
  "sport_key": "americanfootball_nfl",
  "home_team": "Washington Commanders",
  "away_team": "New York Giants",
  "commence_time": "2025-09-07T17:00:00Z",
  "last_update": "2025-08-07T19:04:30.264985+00:00"
}
```

Key traits:
- Single logical line (0) with per-book `home_team` and `away_team` prices.

---

### Normalized UI shape

To keep the table and filters consistent, we normalize each event+market object into a single structure. The table renders based on `market_key` and pulls from the corresponding normalized fields.

TypeScript (conceptual):

```ts
export type GameMarketKey = "h2h" | "spreads" | "totals"

export interface NormalizedBookPrice {
  book: string
  price: number
  link?: string | null
  sid?: string | null
  isStandard: boolean
  team?: string | null // present for spreads side entries
}

export interface NormalizedGameLinesRowBase {
  eventId: string
  sportKey: string
  commenceTime: string
  homeTeam: string
  awayTeam: string
  marketKey: GameMarketKey
  primaryLine: string | null
  lastUpdate: string
  availableLines: string[] // for spreads/totals; ["0"] for h2h
}

export interface NormalizedH2H extends NormalizedGameLinesRowBase {
  marketKey: "h2h"
  moneyline: {
    home: { best?: NormalizedBookPrice; all: NormalizedBookPrice[] }
    away: { best?: NormalizedBookPrice; all: NormalizedBookPrice[] }
  }
}

export interface NormalizedSpreads extends NormalizedGameLinesRowBase {
  marketKey: "spreads"
  // Map absolute line -> side prices
  spreadsByAbsLine: Record<string, {
    home: { best?: NormalizedBookPrice; all: NormalizedBookPrice[] }
    away: { best?: NormalizedBookPrice; all: NormalizedBookPrice[] }
  }>
}

export interface NormalizedTotals extends NormalizedGameLinesRowBase {
  marketKey: "totals"
  totalsByLine: Record<string, {
    over: { best?: NormalizedBookPrice; all: NormalizedBookPrice[] }
    under: { best?: NormalizedBookPrice; all: NormalizedBookPrice[] }
  }>
}

export type NormalizedGameLinesRow = NormalizedH2H | NormalizedSpreads | NormalizedTotals
```

Notes:
- For spreads, `availableLines` and the keyed map use ABSOLUTE values (e.g., `"13.5"`). Internally we look up both `"13.5"` and `"-13.5"` raw keys to build home/away sides based on the `team` fields.
- For h2h, `availableLines` will be `["0"]` and the table hides the line picker.

---

### Normalization algorithms (high level)

Assume each raw object is one event+market. For each event in the array:

- h2h:
  - `availableLines = ["0"]` (or `Object.keys(lines)` if it varies)
  - For each sportsbook in `lines["0"].sportsbooks`: collect `home_team` and `away_team` prices. Compute `best` by price comparison (e.g., highest positive, least negative in American odds).

- spreads:
  - Build a set of absolute line values: for each key `k` in `lines`, add `String(Math.abs(Number(k)))`.
  - For each absolute `L`, derive `plusKey = L` and `minusKey = "-" + L` (handle already-signed keys). 
  - Aggregate across books: from `lines[plusKey].sportsbooks` map, collect entries for one team (as per `team` field). From `lines[minusKey].sportsbooks`, collect the other team.
  - Compute `best` entries per side by comparing American odds.

- totals:
  - `availableLines = Object.keys(lines).sort(numeric)`
  - For each `L`, across books, collect `over` and `under` prices. Compute `best` per side.

American odds comparison utility (sketch):

```ts
function betterAmerican(a: number, b: number, wantHigherReturn = true) {
  // Higher returns: prefer larger positive; among negatives, prefer closer to 0 (e.g., -105 over -120)
  if (a >= 0 && b >= 0) return a >= b
  if (a < 0 && b < 0) return a > b
  return a >= b // positive beats negative
}
```

---

### UI behavior (table + filters)

- Market switch: determines which normalized fields to read.
  - `h2h`: show Home/Away moneyline columns; hide line selector.
  - `spreads`: show line selector (use `availableLines`), then render Home/Away spread prices for the active line.
  - `totals`: show line selector (use `availableLines`), then render Over/Under prices for the active line.

- Sorting: by time, home/away names, or by active market price (e.g., best home price for h2h/spreads, best over price for totals).

- EV/no-vig (future): can be layered on top of normalized `all` collections by computing market averages or synthetic fair odds.

---

### Implementation notes

- The normalization should live in the transform hook (`useTransformedGameLinesData`), returning:
  - `rows: NormalizedGameLinesRow[]`
  - `availableLines: string[]` (global intersection or per-row, but the UI will typically use union of popular lines)
  - `activeLine: string | null`

- Filters:
  - Line selector appears only for `spreads` and `totals`.
  - Sportsbook filter should be applied inside normalization (only consider selected books when computing `best`).

- Table: read only from normalized structure. Avoid reading raw `lines` in the table to keep UI stable if backend evolves.

This design lets us accept differing raw shapes per market while keeping a single consistent UI experience.


