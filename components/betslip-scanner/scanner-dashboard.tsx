"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UploadZone } from "./upload-zone"
import { ExtractionResults } from "./extraction-results"
import LoadingAnimation from "./loading-animation"
import { Sparkles, ArrowLeft } from "lucide-react"

interface BetSelection {
  id: string
  player?: string
  team?: string
  market: string
  line?: number
  betType: "over" | "under" | "moneyline" | "spread"
  sport: string
  sportApiKey?: string // The odds API sport key (e.g., 'baseball_mlb')
  marketApiKey?: string // The odds API market key (e.g., 'batter_home_runs')
  gameId?: string // Event ID from odds API
  confidence: number
  rawText: string
  metadata?: {
    odds?: string
    awayTeam?: string
    homeTeam?: string
    gameTime?: string
    gameDate?: string
  }
}

interface BetslipExtraction {
  selections: BetSelection[]
  confidence: number
  rawText: string
  metadata: {
    sportsbook?: string
    totalOdds?: string
    wagerAmount?: string
    totalPayout?: string
    oddsLookupResults?: {
      gamesFound: number
      matchedSelections: number
    }
  }
}

export function ScannerDashboard() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractionResults, setExtractionResults] = useState<BetslipExtraction | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isLookingUpOdds, setIsLookingUpOdds] = useState(false)
  const [parlayComparison, setParlayComparison] = useState<any>(null)
  const [parlayLinks, setParlayLinks] = useState<Record<string, string | null> | null>(null)

  // Loading animation states
  const [loadingStage, setLoadingStage] = useState<"ocr" | "parsing" | "fetching" | "complete">("ocr")
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [extractedSelections, setExtractedSelections] = useState<
    Array<{
      player: string
      market: string
      odds: string
    }>
  >([])

  // Progress simulation function
  const simulateProgress = (startPercent: number, endPercent: number, duration: number) => {
    const increment = (endPercent - startPercent) / (duration / 50)
    let current = startPercent

    const interval = setInterval(() => {
      current += increment
      setLoadingProgress(Math.min(current, endPercent))

      if (current >= endPercent) {
        clearInterval(interval)
      }
    }, 50)

    return interval
  }

  const handleImageUpload = async (file: File) => {
    setUploadedFile(file)
    setIsProcessing(true)
    setExtractionResults(null)
    setExtractedSelections([])

    // Start loading animation
    setLoadingStage("ocr")
    setLoadingProgress(0)

    // Simulate OCR progress - slower for better visual effect
    const ocrInterval = simulateProgress(0, 25, 4000)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append("image", file)

      // Call our OCR API
      const response = await fetch("/api/betslip-scanner/extract", {
        method: "POST",
        body: formData,
      })

      // Clear OCR progress simulation
      clearInterval(ocrInterval)
      setLoadingProgress(30)

      // Move to parsing stage - slower transition
      setLoadingStage("parsing")
      const parsingInterval = simulateProgress(30, 50, 3000)

      const responseData = await response.json()

      // Handle authentication redirect
      if (response.status === 401) {
        console.log("Authentication required, redirecting to sign-in")
        // Redirect to sign-in page
        window.location.href = "/sign-in"
        return
      }

      if (!response.ok) {
        throw new Error(responseData.details || responseData.error || "Failed to process image")
      }

      // Clear parsing progress simulation
      clearInterval(parsingInterval)
      setLoadingProgress(55)

      // Handle new API response structure
      if (responseData.success && responseData.data) {
        const { selections, sportsbook, confidence, savedBetslipId } = responseData.data

        console.log("✅ API Response Data:", responseData.data)
        console.log("📊 Selections:", selections)
        console.log("🏢 Sportsbook:", sportsbook)
        console.log("🎯 Confidence:", confidence)
        console.log("🆔 Saved Betslip ID:", savedBetslipId)
        console.log("🆔 savedBetslipId type:", typeof savedBetslipId)
        console.log("🆔 savedBetslipId truthy:", !!savedBetslipId)

        // Move to fetching stage and show extracted selections
        setLoadingStage("fetching")
        const fetchingInterval = simulateProgress(55, 90, 5000)

        // Format selections for loading animation - add delay to show them flowing through network
        setTimeout(() => {
          const formattedSelections = selections.map((sel: any) => ({
            player: sel.player || sel.team || "Unknown",
            market: `${sel.market} ${sel.betType} ${sel.line || ""}`.trim(),
            odds: sel.metadata?.odds || "N/A",
          }))
          setExtractedSelections(formattedSelections)
        }, 1000)

        // If we have a saved betslip ID, redirect to the dedicated page
        if (savedBetslipId) {
          console.log("🔄 Redirecting to betslip page:", savedBetslipId)

          // Complete loading animation with longer completion phase
          setTimeout(() => {
            clearInterval(fetchingInterval)
            setLoadingProgress(100)
            setLoadingStage("complete")

            // Longer delay to show completion and celebrate
            setTimeout(() => {
              console.log("🚀 Executing redirect to:", `/betslip/${savedBetslipId}`)
              window.location.href = `/betslip/${savedBetslipId}`
            }, 2000)
          }, 3000)
          return
        } else {
          console.log("❌ No savedBetslipId - falling back to inline results")
        }

        // Fallback: show results inline (for development/testing)
        const results: BetslipExtraction = {
          selections: selections,
          confidence: confidence,
          rawText: "", // Not directly available in new format
          metadata: {
            sportsbook: sportsbook,
          },
        }

        // Clear fetching interval and complete
        clearInterval(fetchingInterval)
        setLoadingProgress(100)
        setLoadingStage("complete")

        // Show completion for a moment, then show results
        setTimeout(() => {
          setExtractionResults(results)
          setIsProcessing(false)

          // If we got selections, automatically lookup current odds
          if (selections.length > 0) {
            lookupCurrentOdds(results)
          }
        }, 1000)
      } else {
        console.error("❌ Invalid response format:", responseData)
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Error processing betslip:", error)
      // TODO: Add proper error handling UI
      alert(error instanceof Error ? error.message : "Failed to process betslip")
      setIsProcessing(false)
    }
  }

  const lookupCurrentOdds = async (results: BetslipExtraction) => {
    if (!results.selections.length) return

    setIsLookingUpOdds(true)

    try {
      const response = await fetch("/api/betslip-scanner/lookup-odds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selections: results.selections,
          sport: "baseball_mlb", // For now, default to MLB
          date: new Date().toISOString().split("T")[0], // Today's date
          includeSids: true,
          includeLinks: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to lookup odds")
      }

      const oddsData = await response.json()
      console.log("Odds lookup results:", oddsData)

      // Store parlay comparison data
      setParlayComparison(oddsData.parlayComparison)
      setParlayLinks(oddsData.parlayLinks)

      // Update the extraction results with enriched selections
      setExtractionResults((prev) =>
        prev
          ? {
              ...prev,
              selections: oddsData.enrichedSelections,
              metadata: {
                ...prev.metadata,
                oddsLookupResults: {
                  gamesFound: oddsData.gamesFound,
                  matchedSelections: oddsData.matchedSelections,
                },
              },
            }
          : null,
      )
    } catch (error) {
      console.error("Error looking up current odds:", error)
    } finally {
      setIsLookingUpOdds(false)
    }
  }

  const handleStartOver = () => {
    setUploadedFile(null)
    setExtractionResults(null)
    setIsProcessing(false)
    setLoadingStage("ocr")
    setLoadingProgress(0)
    setExtractedSelections([])
  }

  // Show loading animation when processing
  if (isProcessing) {
    return <LoadingAnimation stage={loadingStage} progress={loadingProgress} selections={extractedSelections} />
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Modern Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl blur-sm"></div>
            <div className="relative p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Betslip Scanner</h1>
              <Badge
                variant="secondary"
                className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 text-xs px-2 py-1"
              >
                BETA
              </Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">AI-powered betslip analysis</p>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Upload a screenshot of any betslip and we'll extract the picks, compare odds across all major sportsbooks, and
          help you recreate it with the best available lines.
        </p>
      </div>

      {/* Main Content */}
      {!extractionResults ? (
        <UploadZone onImageUpload={handleImageUpload} isProcessing={isProcessing} />
      ) : (
        <div className="space-y-6">
          {/* Back Button */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleStartOver}
              className="gap-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Upload New Betslip
            </Button>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Extracted {extractionResults?.selections?.length || 0} selection
              {(extractionResults?.selections?.length || 0) !== 1 ? "s" : ""}
            </div>
            {isLookingUpOdds && (
              <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                Looking up current odds...
              </div>
            )}
          </div>

          {/* Results */}
          <ExtractionResults
            results={extractionResults}
            uploadedFile={uploadedFile}
            isLookingUpOdds={isLookingUpOdds}
            parlayComparison={parlayComparison}
            parlayLinks={parlayLinks}
          />

          {/* Debug: Show selections data */}
          {extractionResults?.selections && (
            <Card className="p-4 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">Debug: Parsed Selections</h3>
              <div className="space-y-2 text-sm">
                {extractionResults.selections.map((selection, index) => (
                  <div
                    key={index}
                    className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600"
                  >
                    <div className="text-slate-700 dark:text-slate-300">
                      <strong>Player:</strong> {selection.player || "N/A"}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      <strong>Market:</strong> {selection.market}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      <strong>Line:</strong> {selection.line}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      <strong>Sport:</strong> {selection.sport}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      <strong>Sport API Key:</strong> {selection.sportApiKey}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      <strong>Market API Key:</strong> {selection.marketApiKey}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      <strong>Game ID:</strong> {selection.gameId || "Not matched"}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      <strong>Odds:</strong> {selection.metadata?.odds || "N/A"}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      <strong>Teams:</strong> {selection.metadata?.awayTeam} @ {selection.metadata?.homeTeam}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Enhanced Feature Info */}
      <Card className="mt-12 p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800">
        <div className="text-center space-y-6">
          <h3 className="font-semibold text-slate-900 dark:text-white text-lg">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-purple-600/10 dark:from-purple-500/20 dark:to-purple-600/20 rounded-xl flex items-center justify-center mx-auto border border-purple-200 dark:border-purple-700/50">
                <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">1</span>
              </div>
              <p className="font-medium text-slate-900 dark:text-white">Upload Screenshot</p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Take a screenshot of any betslip from social media or sportsbooks
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-purple-600/10 dark:from-purple-500/20 dark:to-purple-600/20 rounded-xl flex items-center justify-center mx-auto border border-purple-200 dark:border-purple-700/50">
                <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">2</span>
              </div>
              <p className="font-medium text-slate-900 dark:text-white">AI Extraction</p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Our AI reads the image and extracts all the bet selections automatically
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-purple-600/10 dark:from-purple-500/20 dark:to-purple-600/20 rounded-xl flex items-center justify-center mx-auto border border-purple-200 dark:border-purple-700/50">
                <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">3</span>
              </div>
              <p className="font-medium text-slate-900 dark:text-white">Compare & Bet</p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Compare odds across all sportsbooks and recreate with one click
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
