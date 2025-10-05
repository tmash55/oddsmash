# 🏀 KOTP Tracker Overview (King of the Playoffs)

This document outlines the purpose, architecture, and logic for building the **King of the Playoffs (KOTP)** tracker feature in the Oddsmash application.

---

## 📌 Promo Summary

**DraftKings King of the Playoffs (KOTP)** is a promotional contest during the NBA playoffs.

- Users select one player who they think will lead the NBA in **total points scored in Round 1**.
- Winners who picked the top scorer **split $2 million in bonus bets**.
- Our site tracks each player's point totals live so users can follow the leaderboard throughout Round 1.

---

## 🎯 Goal

Build a **live-updating leaderboard** that:

- Tracks **total points scored** in Round 1 by every playoff player.
- Combines **live game data** with **completed game data**.
- Avoids a database for now by using **Upstash Redis** for caching.
- Integrates seamlessly into the existing `/trackers` route structure.

---

## 🔗 Data Sources

### 1. NBA Game Logs (Completed Games)
- **Endpoint**: `https://stats.nba.com/stats/leaguegamelog`
- **Params**:
  - `PlayerOrTeam=P`
  - `Season=2023-24`
  - `SeasonType=Playoffs`

- **Usage**: Returns a list of every playoff game per player. We use this to **sum total points for completed games only**.

---

### 2. NBA Live Boxscores (Ongoing Games)
- **Endpoint**: `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_{gameId}.json`
- **Usage**: Returns **live stats** including current points for in-progress games.
- If the game is not yet reflected in the game log, we **add this to the player’s total**.

---

## 🧠 How It Works

### 1. Game Day (Live)
- Fetch all live games and boxscores.
- For each player, check if their current game **is in** the gamelog.
  - If **not**, add their **live points** to their **logged total**.
  - If **yes**, only use the **gamelog total** (to prevent double-counting).

### 2. Off Day (No Games)
- Just use gamelog totals to populate the leaderboard.

---

## 🧱 Architecture

### `/api/kotp-leaderboard` (Coming Soon)
- Combines live + logged points per player.
- Caches gamelogs and scoreboard data in Redis.
- Returns sorted leaderboard by total points.

### Redis Cache Keys
- Game logs: `kotp:gamelogs:2023-24`
- Live scoreboard data: `nba:scoreboard:today`
- Leaderboard output: `kotp:leaderboard:round1`

---

## 🖥️ UI Pages

### `/kotp`
- Informational landing page for the KOTP promo.
- Includes:
  - Promo explanation
  - Prize breakdown
  - Button to `/trackers/kotp-leaderboard`

### `/trackers/kotp-leaderboard`
- Live leaderboard of all players
- Table or card view
- Features:
  - Total Points, PPG, Series Status (✅/🔄)
  - Search + pin favorite players
  - Optional tab for Playoff Bracket (from `/stats/playoffpicture`)

---

## ✅ Advantages

- **No database needed** — uses cached API data
- **Real-time** leaderboard for fans following their players
- **Low cost**, scalable solution with static + serverless structure

---

## 🚧 Notes / Open Questions

- Do we want to track assists or rebounds as future promos evolve?
- How should we handle ties visually?
- Can we pull in team logos or player headshots later?

---

## 📅 Launch Timeline

- ✅ Plan + data sources confirmed
- ✅ API tested for gamelogs + live data
- ⏳ Build `/api/kotp-leaderboard`
- ⏳ Build frontend components
- ⏳ Deploy before start of Playoff Round 1 (April 20)

---

_This doc is designed for AI agents and developers working in Cursor to understand the full context of the KOTP leaderboard feature._
