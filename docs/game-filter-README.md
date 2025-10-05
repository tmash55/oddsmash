# Game Filter Implementation for OddSmash

This document explains the implementation of the game filter feature in the OddSmash hit rate table component.

## Overview

The game filter allows users to filter player hit rate profiles by specific games, making it easier to focus on players participating in particular matchups. This is useful when users want to analyze player performance for upcoming games.

## Implementation Details

### 1. Data Structure

Each `PlayerHitRateProfile` now includes:

- `odds_event_id`: Unique identifier for the game/event
- `home_team`: Name of the home team
- `away_team`: Name of the away team
- `commence_time`: ISO timestamp for when the game starts

### 2. Filter Component

The filter appears in the UI as a dropdown that:
- Shows "All Games" when no filters are applied
- Shows a specific game name when one game is selected
- Shows the count of selected games when multiple are selected
- Displays games sorted by date/time
- Formats game names as "{away_team} @ {home_team} - {date} {time}"

### 3. State Management

The dashboard component:
- Extracts unique games from player profiles
- Maintains a `selectedGames` state that's either `null` (all games) or an array of game IDs
- Filters profiles based on selected games
- Resets to page 1 when filter changes

### 4. No Database Changes Required

The current implementation doesn't require a separate database table for games since:
- Game data is already included in player profiles
- Games are extracted and deduplicated in memory
- This approach is more efficient for the current use case

## Future Enhancements

If game filtering becomes a central feature, consider:
1. Creating a dedicated games table for more detailed game information
2. Adding game filters by league, date range, or team
3. Implementing a calendar view for game selection

## Usage Example

1. Open the hit rate dashboard
2. Click the "Game" dropdown
3. Select one or more games to filter the table
4. The table will update to show only players from the selected games 