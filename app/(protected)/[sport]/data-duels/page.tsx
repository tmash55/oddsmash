"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { fetchHitRateProfiles } from "@/services/hit-rates"
import { PlayerHitRateProfile } from "@/types/hit-rates"

interface GamePreview {
  id: string
  date: string
  homeTeam: string
  awayTeam: string
  startTime: string
}

export default function DataDuelsPage({ params }: { params: { sport: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [games, setGames] = useState<GamePreview[]>([])

  useEffect(() => {
    const loadGames = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch all profiles for today's games
        const profiles = await fetchHitRateProfiles({
          sport: params.sport.toUpperCase(),
        })

        // Group profiles by game
        const gameMap = new Map<string, GamePreview>()
        
        // Log all unique event IDs
        const eventIds = new Set<string>()
        profiles.forEach(profile => {
          if (profile.odds_event_id) {
            eventIds.add(profile.odds_event_id)
          }
        })
        console.log("[DATA DUELS] Found event IDs:", Array.from(eventIds))
        
        profiles.forEach(profile => {
          if (profile.odds_event_id && profile.home_team && profile.away_team && profile.commence_time) {
            gameMap.set(profile.odds_event_id, {
              id: profile.odds_event_id,
              date: new Date(profile.commence_time).toLocaleDateString(),
              homeTeam: profile.home_team,
              awayTeam: profile.away_team,
              startTime: new Date(profile.commence_time).toLocaleTimeString(),
            })
          }
        })

        const gamesList = Array.from(gameMap.values())
        setGames(gamesList)

        // Log each game's URL
        gamesList.forEach(game => {
          const date = new Date(game.date).toISOString().split('T')[0]
          
          // Format team names for URL
          const formatTeamForUrl = (teamName: string) => {
            // Remove spaces and special characters
            return teamName
              .replace(/\s+/g, '')  // Remove spaces
              .replace(/\./g, '')   // Remove periods
              .replace(/&/g, 'and') // Replace & with 'and'
              .replace(/[^a-zA-Z0-9]/g, '') // Remove any other special characters
          }

          const homeTeamUrl = formatTeamForUrl(game.homeTeam)
          const awayTeamUrl = formatTeamForUrl(game.awayTeam)
          const matchup = `${homeTeamUrl}-vs-${awayTeamUrl}`
          const url = `/${params.sport}/data-duels/${date}/${matchup}`
          
          console.log(`[DATA DUELS] Game URL mapping:`, {
            eventId: game.id,
            url,
            homeTeam: game.homeTeam,
            homeTeamUrl,
            awayTeam: game.awayTeam,
            awayTeamUrl,
            date: game.date,
            startTime: game.startTime
          })
        })

      } catch (err) {
        console.error("Error loading games:", err)
        setError("Failed to load games")
      } finally {
        setLoading(false)
      }
    }

    loadGames()
  }, [params.sport])

  const handleGameClick = (game: GamePreview) => {
    const date = new Date(game.date).toISOString().split('T')[0]
    
    // Format team names for URL
    const formatTeamForUrl = (teamName: string) => {
      // Remove spaces and special characters
      return teamName
        .replace(/\s+/g, '')  // Remove spaces
        .replace(/\./g, '')   // Remove periods
        .replace(/&/g, 'and') // Replace & with 'and'
        .replace(/[^a-zA-Z0-9]/g, '') // Remove any other special characters
    }

    const homeTeamUrl = formatTeamForUrl(game.homeTeam)
    const awayTeamUrl = formatTeamForUrl(game.awayTeam)
    const matchup = `${homeTeamUrl}-vs-${awayTeamUrl}`
    router.push(`/${params.sport}/data-duels/${date}/${matchup}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
          <h3 className="font-bold text-lg">Error Loading Games</h3>
          <p>{error}</p>
        </Card>
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-4">
          <h3 className="font-bold text-lg">No Games Found</h3>
          <p>There are no games scheduled for today.</p>
        </Card>
      </div>
    )
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Duels</h1>
        <p className="text-muted-foreground">
          Select a game to view detailed player statistics and matchup analysis.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <Card
            key={game.id}
            className="p-4 hover:bg-accent transition-colors cursor-pointer"
            onClick={() => handleGameClick(game)}
          >
            <div className="text-lg font-semibold mb-2">
              {game.homeTeam} vs {game.awayTeam}
            </div>
            <div className="text-sm text-muted-foreground">
              {game.date} • {game.startTime}
            </div>
          </Card>
        ))}
      </div>
    </main>
  )
} 