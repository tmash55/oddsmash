"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import HitStreaks from "./hit-streaks"
import StrikeoutOvers from "./strikeout-overs"
import BounceBackCandidates from "./bounce-back-candidates"
import HitConsistency from "./hit-consistency"
import HighHitRate from "./high-hit-rate"
import { HitStreakPlayer, StrikeoutOverCandidate, BounceBackCandidate, HitConsistencyCandidate } from "./types"
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
import { useRouter, useSearchParams } from "next/navigation"
import FeedbackButton from "@/components/shared/FeedbackButton"

interface QuickHitsProps {
  className?: string
}

const tabs = [
  { id: "hit-streaks", label: "Hit Streaks" },
  { id: "strikeout-overs", label: "Strikeout Overs" },
  { id: "bounce-back-candidates", label: "Bounce Back" },
  { id: "hit-consistency", label: "Hit Consistency" },
  { id: "high-hit-rate", label: "High Hit Rate" },
]

export default function HitSheetsDashboard({ className }: QuickHitsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hitStreakData, setHitStreakData] = useState<HitStreakPlayer[]>([])
  const [strikeoutOverData, setStrikeoutOverData] = useState<StrikeoutOverCandidate[]>([])
  const [bounceBackData, setBounceBackData] = useState<BounceBackCandidate[]>([])
  const [hitConsistencyData, setHitConsistencyData] = useState<HitConsistencyCandidate[]>([])
  const [highHitRateData, setHighHitRateData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "hit-streaks")
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [bounceBackParams, setBounceBackParams] = useState({
    hitRate: "0.6",
    sampleSpan: "last_20"
  })
  const [strikeoutParams, setStrikeoutParams] = useState({
    hitRate: "0.8"
  })
  const [hitConsistencyParams, setHitConsistencyParams] = useState({
    hitRate: "0.9",
    sampleSpan: "last_10"
  })
  const [highHitRateParams, setHighHitRateParams] = useState({
    hitRate: "0.9",
    sampleSpan: "last_10"
  })

  useEffect(() => {
    // Update URL when tab changes
    const params = new URLSearchParams()
    params.set("tab", activeTab)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [activeTab, router])

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
          const response = await fetch(`/api/strikeout-overs?hit_rate=${strikeoutParams.hitRate}`)
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to fetch strikeout over data")
          }
          const data = await response.json()
          setStrikeoutOverData(data)
        } else if (activeTab === "bounce-back-candidates") {
          const response = await fetch(
            `/api/bounce-back-candidates?hit_rate=${bounceBackParams.hitRate}&sample_span=${bounceBackParams.sampleSpan}`
          )
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to fetch bounce back data")
          }
          const data = await response.json()
          setBounceBackData(data)
        } else if (activeTab === "hit-consistency") {
          const response = await fetch(
            `/api/hit-consistency?hit_rate=${hitConsistencyParams.hitRate}&sample_span=${hitConsistencyParams.sampleSpan}`
          )
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to fetch hit consistency data")
          }
          const data = await response.json()
          setHitConsistencyData(data)
        } else if (activeTab === "high-hit-rate") {
          const response = await fetch(
            `/api/high-hit-rate?hit_rate=${highHitRateParams.hitRate}&sample_span=${highHitRateParams.sampleSpan}`
          )
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to fetch high hit rate data")
          }
          const data = await response.json()
          setHighHitRateData(data)
        }
      } catch (err) {
        console.error(`Error loading ${activeTab} data:`, err)
        setError(`Failed to load ${activeTab} data`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [activeTab, bounceBackParams, strikeoutParams, hitConsistencyParams, highHitRateParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleBounceBackParamsChange = (params: { hitRate?: string; sampleSpan?: string }) => {
    setBounceBackParams(prev => ({
      ...prev,
      ...params
    }))
  }

  const handleStrikeoutParamsChange = (params: { hitRate: string }) => {
    setStrikeoutParams(prev => ({
      ...prev,
      ...params
    }))
  }

  const handleHitConsistencyParamsChange = (params: { hitRate?: string; sampleSpan?: string }) => {
    setHitConsistencyParams(prev => ({
      ...prev,
      ...params
    }))
  }

  const handleHighHitRateParamsChange = (params: { hitRate?: string; sampleSpan?: string }) => {
    setHighHitRateParams(prev => ({
      ...prev,
      ...params
    }))
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
        return <StrikeoutOvers 
          data={strikeoutOverData} 
          onParamsChange={handleStrikeoutParamsChange}
          params={strikeoutParams}
        />
      case "bounce-back-candidates":
        return (
          <BounceBackCandidates 
            data={bounceBackData}
            onParamsChange={handleBounceBackParamsChange}
            params={bounceBackParams}
          />
        )
      case "hit-consistency":
        return (
          <HitConsistency
            data={hitConsistencyData}
            onParamsChange={handleHitConsistencyParamsChange}
            params={hitConsistencyParams}
          />
        )
      case "high-hit-rate":
        return (
          <HighHitRate
            data={highHitRateData}
            onParamsChange={handleHighHitRateParamsChange}
            params={highHitRateParams}
          />
        )
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
    <main className="container mx-auto py-8 px-4">
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Hit Sheets</h2>
            <p className="text-base text-muted-foreground/90 leading-relaxed max-w-[85ch]">
              Fast access to popular hit rate functions and data sets. For detailed hit rate analysis, visit our{" "}
              <a href="/hit-rates" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500 underline">
                High Rate
              </a>
              {" "}page.
            </p>
          </div>
          <FeedbackButton toolName="hit_sheets" />
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
    </main>
  )
} 