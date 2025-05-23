# MLB Team Logos in OddSmash

This document explains how to use MLB team logos in the OddSmash app.

## Logo Organization

All MLB team logos are stored in the `/public/images/mlb-teams/` directory in the following format:

- Primary format: SVG (vector) - `/public/images/mlb-teams/TEAM_ABBR.svg`
- Fallback format: PNG (raster) - `/public/images/mlb-teams/TEAM_ABBR.png`

Where `TEAM_ABBR` is the standard MLB team abbreviation (e.g., NYY, BOS, LAD).

## Implementation Details

The application is set up to use team logos in the following components:

1. **Hit Rate Table** (`hit-rate-table-v2.tsx`):
   - Player team logo next to team abbreviation
   - Matchup information with opponent team logo

2. **Hit Rate Card** (`hit-rate-card-v2.tsx`):
   - Player team logo next to team abbreviation
   - Matchup information with opponent team logo

## Team Abbreviation Mapping

To handle discrepancies between file names and standard abbreviations, both components include a mapping system:

```tsx
// Map team abbreviations to handle special cases and variations
const teamAbbreviationMap: Record<string, string> = {
  // Arizona Diamondbacks variations
  'ARI': 'AZ',  // Standard abbreviation maps to file name
  'ARIZONA': 'AZ',
  'DIAMONDBACKS': 'AZ',
  
  // Add other mappings as needed
};

// Function to get the correct file name for a team abbreviation
function getTeamLogoFilename(abbr: string): string {
  if (!abbr) return 'default';
  
  const upperAbbr = abbr.toUpperCase();
  return teamAbbreviationMap[upperAbbr] || abbr;
}
```

For example, this mapping converts the standard "ARI" abbreviation to "AZ" to match the file name.

## How It Works

The application uses Next.js Image component with progressive fallbacks:

1. First tries to load the SVG version of the logo
2. If SVG fails, falls back to PNG version
3. If both fail, uses a placeholder image

## Adding New Team Logos

When adding new team logos:

1. Save the SVG version in `/public/images/mlb-teams/TEAM_ABBR.svg`
2. Save the PNG version in `/public/images/mlb-teams/TEAM_ABBR.png`
3. Make sure the abbreviation matches what's used in the app
4. If the file name doesn't match the standard abbreviation, add a mapping to `teamAbbreviationMap`

## Team Abbreviations

The standard MLB team abbreviations used in the app are:

| Team | Abbreviation | Logo Filename |
|------|--------------|---------------|
| Arizona Diamondbacks | ARI | AZ.svg |
| Atlanta Braves | ATL | ATL.svg |
| Baltimore Orioles | BAL | BAL.svg |
| Boston Red Sox | BOS | BOS.svg |
| Chicago Cubs | CHC | CHC.svg |
| Chicago White Sox | CHW | CHW.svg |
| Cincinnati Reds | CIN | CIN.svg |
| Cleveland Guardians | CLE | CLE.svg |
| Colorado Rockies | COL | COL.svg |
| Detroit Tigers | DET | DET.svg |
| Houston Astros | HOU | HOU.svg |
| Kansas City Royals | KC | KC.svg |
| Los Angeles Angels | LAA | LAA.svg |
| Los Angeles Dodgers | LAD | LAD.svg |
| Miami Marlins | MIA | MIA.svg |
| Milwaukee Brewers | MIL | MIL.svg |
| Minnesota Twins | MIN | MIN.svg |
| New York Mets | NYM | NYM.svg |
| New York Yankees | NYY | NYY.svg |
| Oakland Athletics | OAK | OAK.svg |
| Philadelphia Phillies | PHI | PHI.svg |
| Pittsburgh Pirates | PIT | PIT.svg |
| San Diego Padres | SD | SD.svg |
| Seattle Mariners | SEA | SEA.svg |
| San Francisco Giants | SF | SF.svg |
| St. Louis Cardinals | STL | STL.svg |
| Tampa Bay Rays | TB | TB.svg |
| Texas Rangers | TEX | TEX.svg |
| Toronto Blue Jays | TOR | TOR.svg |
| Washington Nationals | WSH | WSH.svg |

## Error Handling

The code includes error handling to gracefully degrade if a logo can't be found:

```tsx
<Image
  src={`/images/mlb-teams/${getTeamLogoFilename(teamAbbreviation)}.svg`}
  alt={teamAbbreviation || "Team"}
  width={16}
  height={16}
  className="object-contain"
  onError={(e) => {
    // Try PNG if SVG fails
    (e.target as HTMLImageElement).src = `/images/mlb-teams/${getTeamLogoFilename(teamAbbreviation)}.png`;
    // Fallback to placeholder if PNG also fails
    (e.target as HTMLImageElement).onerror = () => {
      (e.target as HTMLImageElement).src = "/placeholder.svg?height=16&width=16";
    };
  }}
/>
``` 