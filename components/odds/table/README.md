# OddsTable Component

A reusable, fully-typed table component for displaying odds data across different sports and markets.

## Features

- ✅ **Standardized Types**: Uses comprehensive TypeScript interfaces from `odds-screen-types.ts`
- ✅ **Sportsbook Columns**: Individual columns for each sportsbook with logos and odds
- ✅ **Sorting**: Click column headers to sort by any field
- ✅ **Interactive**: Configurable row and odds click handlers
- ✅ **Sticky Columns**: First column sticks for better scrolling experience
- ✅ **Loading States**: Built-in loading, error, and empty states
- ✅ **Responsive**: Horizontal scroll for many sportsbook columns
- ✅ **Dark Mode**: Fully responsive to light/dark theme changes
- ✅ **Visual Design**: Color-coded over/under odds with sportsbook branding
- ✅ **Accessible**: Proper ARIA labels and keyboard navigation

## Usage

```tsx
import { OddsTable, type OddsTableItem } from '@/components/odds/table'

function MyOddsPage() {
  const [data, setData] = useState<OddsTableItem[]>([])
  const [loading, setLoading] = useState(true)
  
  return (
    <OddsTable 
      data={data}
      loading={loading}
      error={null}
      sport="nfl"
      type="game"
      market="total"
      scope="pregame"
      visibleSportsbooks={['draftkings', 'fanduel', 'betmgm', 'caesars']}
      maxSportsbookColumns={8}
      onRowClick={(item) => {
        console.log('Row clicked:', item.entity.name)
      }}
      onOddsClick={(item, side, book) => {
        console.log('Odds clicked:', { player: item.entity.name, side, book })
        // Add to betslip, open sportsbook link, etc.
      }}
    />
  )
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | `OddsTableItem[]` | ✅ | Array of odds items to display |
| `loading` | `boolean` | ❌ | Shows loading state (default: `false`) |
| `error` | `string \| null` | ❌ | Error message to display |
| `sport` | `string` | ✅ | Sport identifier (e.g., "nfl", "nba") |
| `type` | `'game' \| 'player'` | ✅ | Type of props being displayed |
| `market` | `string` | ✅ | Market identifier (e.g., "total", "passing_tds") |
| `scope` | `'pregame' \| 'live'` | ✅ | Timing scope of the odds |
| `visibleSportsbooks` | `string[]` | ❌ | Array of sportsbook IDs to show as columns |
| `maxSportsbookColumns` | `number` | ❌ | Maximum number of sportsbook columns (default: 8) |
| `onRowClick` | `(item: OddsTableItem) => void` | ❌ | Handler for row clicks |
| `onOddsClick` | `(item, side, book) => void` | ❌ | Handler for odds button clicks |
| `className` | `string` | ❌ | Additional CSS classes |

## Data Structure

The component expects data in the standardized `OddsScreenItem` format:

```typescript
interface OddsScreenItem {
  id: string
  entity: {
    type: 'player' | 'game'
    name: string
    details?: string
  }
  event: {
    id: string
    startTime: string
    homeTeam: string
    awayTeam: string
  }
  odds: {
    best: {
      over?: { price: number; line: number; book: string; link?: string }
      under?: { price: number; line: number; book: string; link?: string }
    }
    average: { /* ... */ }
    opening: { /* ... */ }
    books: { /* ... */ }
  }
}
```

## Sorting

The table supports sorting by:
- **Entity**: Player/game name
- **Event**: Away @ Home team matchup
- **Best Over**: Best over odds price
- **Best Under**: Best under odds price  
- **Start Time**: Event start time

Click any column header to sort. Click again to reverse the direction.

## States

### Loading State
```tsx
<OddsTable 
  data={[]}
  loading={true}
  // ... other props
/>
```

### Error State
```tsx
<OddsTable 
  data={[]}
  error="Failed to load odds data"
  // ... other props
/>
```

### Empty State
```tsx
<OddsTable 
  data={[]}
  loading={false}
  error={null}
  // ... other props
/>
```

## Integration with API

Works seamlessly with the `/api/odds-screen` endpoint:

```tsx
useEffect(() => {
  async function fetchData() {
    const response = await fetch(`/api/odds-screen?sport=${sport}&type=${type}&market=${market}&scope=${scope}`)
    const result = await response.json()
    
    if (result.success) {
      setData(result.data) // Already in correct format
    }
  }
  
  fetchData()
}, [sport, type, market, scope])
```

## Extending

To add new features:

1. **New columns**: Update the table headers and row cells
2. **New interactions**: Add new props extending `TableInteractionHandlers`
3. **New states**: Add loading/error states for specific scenarios
4. **Mobile support**: Add responsive breakpoints and mobile layouts

## Related Components

- `odds-screen-types.ts` - Comprehensive type definitions
- `/api/odds-screen` - Data source API endpoint
- `odds/[sport]/page.tsx` - Example usage in sport-specific pages
