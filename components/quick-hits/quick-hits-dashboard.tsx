"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import HitStreaks from "./hit-streaks"
import StrikeoutOvers from "./strikeout-overs"
import { HitStreakPlayer, StrikeoutOverCandidate } from "./types"
import { useEffect, useState } from "react"
import { fetchHitStreaks } from "@/services/hit-streaks"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface QuickHitsProps {
  className?: string
}

const tabs = [
  { id: "hit-streaks", label: "Hit Streaks" },
  { id: "strikeout-overs", label: "Strikeout Overs" },
  { id: "hot-hitters", label: "Hot Hitters" },
  { id: "matchups", label: "Matchup Analysis" },
  { id: "multi-hits", label: "Multi-Hit Games" },
]

export default function QuickHitsDashboard({ className }: QuickHitsProps) {
  const [hitStreakData, setHitStreakData] = useState<HitStreakPlayer[]>([])
  const [strikeoutOverData, setStrikeoutOverData] = useState<StrikeoutOverCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("hit-streaks")
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Load data based on active tab
        if (activeTab === "hit-streaks") {
          const data = await fetchHitStreaks()
          setHitStreakData(data)
        } else if (activeTab === "strikeout-overs") {
          const response = await fetch("/api/strikeout-overs?hit_rate=0.8")
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to fetch strikeout over data")
          }
          const data = await response.json()
          setStrikeoutOverData(data)
        }
      } catch (err) {
        console.error(`Error loading ${activeTab} data:`, err)
        setError(`Failed to load ${activeTab} data`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [activeTab])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const renderContent = (tabId: string) => {
    if (loading) {
      return (
        <Card className="p-4">
          <div className="text-center text-muted-foreground">
            Loading {tabId.replace("-", " ")}...
          </div>
        </Card>
      )
    }

    if (error) {
      return (
        <Card className="p-4">
          <div className="text-center text-red-500">
            {error}
          </div>
        </Card>
      )
    }

    switch (tabId) {
      case "hit-streaks":
        return <HitStreaks data={hitStreakData} />
      case "strikeout-overs":
        return <StrikeoutOvers data={strikeoutOverData} />
      case "hot-hitters":
        return (
          <Card className="p-4">
            <div className="text-center text-muted-foreground">
              Hot Hitters analysis coming soon
            </div>
          </Card>
        )
      case "matchups":
        return (
          <Card className="p-4">
            <div className="text-center text-muted-foreground">
              Matchup analysis coming soon
            </div>
          </Card>
        )
      case "multi-hits":
        return (
          <Card className="p-4">
            <div className="text-center text-muted-foreground">
              Multi-hit games analysis coming soon
            </div>
          </Card>
        )
      default:
        return null
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quick Hits</h2>
          <p className="text-muted-foreground">
            Fast access to popular hit rate functions and data sets
          </p>
        </div>
      </div>

      {isMobile ? (
        <div className="space-y-4">
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {tabs.find(tab => tab.id === activeTab)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {tabs.map(tab => (
                <SelectItem key={tab.id} value={tab.id}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-4">
            {renderContent(activeTab)}
          </div>
        </div>
      ) : (
        <Tabs defaultValue="hit-streaks" className="space-y-4" onValueChange={handleTabChange}>
          <TabsList>
            {tabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-4">
              {renderContent(tab.id)}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
} 