# ⚾ OddSmash: Sports Prop Betting Companion

## 🏷️ Project Name
**OddSmash** – A modern, mobile-first sports betting tool that helps users make smarter prop bets by combining historical player data (hit rates) with real-time odds from top sportsbooks.

---

## 🧭 Project Overview

OddSmash is a web app designed for recreational and sharp sports bettors who want a clearer edge when building player prop bets.

The app's core value lies in surfacing **data-driven prop insights**, including:
- **Hit rate tracking** (player performance over recent games)
- **Odds comparison** across sportsbooks
- Tools like **parlay builders**, **player comparison**, and more.

---

## 🧰 Existing Features (MVP / Beta Phase)

### 🧮 Parlay Builder
A clean interface to:
- Add player props to a custom parlay
- See potential payout based on real-time odds
- Export / copy the parlay to place on your sportsbook

> **Goal**: Make it easier to build smarter, value-driven parlays using actual hit rate + odds value instead of "gut" picks.

---

### ⚔️ Player Comparison Tool
Compare 2+ players side by side across:
- Hit rates (last 5, 10, 20 games)
- Available prop markets
- Best odds for each market
- Projected value based on historical trends

> **Goal**: Help users quickly see which players are offering better value across a specific market (e.g., Total Bases or Strikeouts).

---
## 📊 Hit Rate Feature (Core Data Engine)

The Hit Rate system powers the majority of OddSmash insights. It answers the key question:

> "How often does this player hit the line set by sportsbooks?"

### ⚙️ Data Overview
- **Automated Daily**: Updated each morning via a Pipedream workflow
- **Markets Covered**: Hits, Total Bases, Home Runs, Strikeouts, RBIs
- **Rolling Windows**:
  - Last 5 games
  - Last 10 games
  - Last 20 games

### 🧩 How It's Used
- Shown as % next to each prop (e.g. "7/10 · 70% Hit Rate")
- Color-coded badges for easy scan (Green = Strong Trend)
- Integrated into dashboards, player detail pages, and future tools (like EV calc)

### 🗃️ Stored In:
- Supabase table: `player_hit_rate_profiles`
- Linked by shared `player_id` across:
  - `mlb_player_game_logs`
  - `player_props`
  - `mlb_games`

### 🔗 Matching Logic
- Hit rates are tied to props using:  
  `player_id` + `market` + `stat_target`
- For example:  
  `Aaron Judge – HRs – Over 0.5` → match hit rate for HRs over last 10 games

### 🔍 Usage Ideas
- Filter players by high hit rate
- Identify value props (high hit %, underdog odds)
- Inform parlay decisions

---
## 📁 Project Structure & Useful Files

The OddSmash project is organized to keep data, utilities, and client logic cleanly separated. Here are the key folders and files used in the project:

---

### 📦 `/libs/supabase`

This folder manages all Supabase-related functionality:
- `client.ts` — Instantiates and exports a browser-side Supabase client.
- `server.ts` — Creates and manages a secure Supabase client on the server.
- `middleware.ts` — Handles authentication/session context for Supabase operations.

> **Purpose**: Centralizes access to Supabase, allowing consistent auth/session use across server and client.

---

### ⚙️ `/lib` (Shared Utilities)

This folder includes all project-wide utility functions and constants:
- `odds.ts` — Odds formatting, conversion (American ↔ Decimal), and sorting.
- `sportsbooks.ts` — Book metadata, logo URLs, link templates.
- `sports.ts` — League identifiers, market mappings, etc.
- `env.ts` — Loads and validates environment variables.

> **Purpose**: Keeps logic for common calculations and constants clean and DRY.

---

### 🌐 `.env.local`

Holds environment-specific secrets and configuration keys:
- Supabase project URL and anon key
- Any API keys for odds providers or third-party services
- Feature flags or dev/staging toggles

> **Note**: Make sure this file is excluded from version control (`.gitignore`).

---

## 🔌 Next Step: Database Integration

Before building the frontend, we must ensure the frontend project is fully connected to Supabase.

### Step 1: Supabase Setup
- [ ] Verify `.env.local` includes correct keys:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
- [ ] Confirm Supabase client (`libs/supabase/client.ts`) works
- [ ] Test simple data pull from `player_hit_rate_profiles`

---

## 🎨 Step 2: Begin Frontend Work

Once database access is confirmed, begin building the following core UI:

- [ ] `/hit-rates` Dashboard
- Hit rate + odds per player per market
- Filters: team, market, hit %, sportsbook

- [ ] `/player/:id` Page
- Player detail view
- Hit rate chart (last 5, 10, 20 games)
- Odds by market across books

> From here, we’ll iterate toward a public MVP and layer in tools like compare view, parlay builder, and alerts.

---

Next section: Frontend Component Plan + Notion Task Sync

