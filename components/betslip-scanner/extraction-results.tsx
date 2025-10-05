"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit3, Check, X, AlertCircle, TrendingUp, User, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface BetSelection {
  id: string
  player?: string
  team?: string
  market: string
  line?: number
  betType: "over" | "under" | "moneyline" | "spread"
  sport: string
  confidence: number
  rawText: string
  metadata?: {
    awayTeam?: string
    homeTeam?: string
    playerTeam?: string
    gameTime?: string
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
  }
}

interface ExtractionResultsProps {
  results: BetslipExtraction
  uploadedFile: File | null
  isLookingUpOdds?: boolean
  parlayComparison?: any
  parlayLinks?: Record<string, string | null> | null
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const getColor = (conf: number) => {
    if (conf >= 0.8)
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
    if (conf >= 0.6)
      return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700"
    return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
  }

  const getLabel = (conf: number) => {
    if (conf >= 0.8) return "High"
    if (conf >= 0.6) return "Medium"
    return "Low"
  }

  return (
    <Badge variant="outline" className={cn("text-xs font-medium border", getColor(confidence))}>
      {getLabel(confidence)} ({Math.round(confidence * 100)}%)
    </Badge>
  )
}

function SelectionCard({
  selection,
  onUpdate,
}: {
  selection: BetSelection
  onUpdate: (updated: BetSelection) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedSelection, setEditedSelection] = useState(selection)

  const handleSave = () => {
    onUpdate(editedSelection)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedSelection(selection)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <Card className="p-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Edit Selection</h4>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} className="h-8">
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 bg-transparent">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="player" className="text-sm font-medium">
                Player/Team
              </Label>
              <Input
                id="player"
                value={editedSelection.player || editedSelection.team || ""}
                onChange={(e) =>
                  setEditedSelection({
                    ...editedSelection,
                    player: e.target.value,
                  })
                }
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="market" className="text-sm font-medium">
                Market
              </Label>
              <Input
                id="market"
                value={editedSelection.market}
                onChange={(e) =>
                  setEditedSelection({
                    ...editedSelection,
                    market: e.target.value,
                  })
                }
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="betType" className="text-sm font-medium">
                Bet Type
              </Label>
              <Select
                value={editedSelection.betType}
                onValueChange={(value: "over" | "under" | "moneyline" | "spread") =>
                  setEditedSelection({ ...editedSelection, betType: value })
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="over">Over</SelectItem>
                  <SelectItem value="under">Under</SelectItem>
                  <SelectItem value="moneyline">Moneyline</SelectItem>
                  <SelectItem value="spread">Spread</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="line" className="text-sm font-medium">
                Line
              </Label>
              <Input
                id="line"
                type="number"
                step="0.5"
                value={editedSelection.line || ""}
                onChange={(e) =>
                  setEditedSelection({
                    ...editedSelection,
                    line: Number.parseFloat(e.target.value) || undefined,
                  })
                }
                className="h-10"
              />
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                {selection.player || selection.team || "Unknown Player"}
              </h4>
            </div>
            <ConfidenceIndicator confidence={selection.confidence} />
          </div>

          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Target className="h-4 w-4" />
            <span className="font-medium">{selection.market}</span>
            {selection.line && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {selection.betType === "over" ? "Over" : selection.betType === "under" ? "Under" : selection.betType}{" "}
                {selection.line}
              </Badge>
            )}
          </div>

          {/* Game Information */}
          {(selection.metadata?.awayTeam || selection.metadata?.homeTeam) && (
            <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <span className="font-medium text-slate-700 dark:text-slate-300">Game:</span>
              {selection.metadata.awayTeam && selection.metadata.homeTeam ? (
                <span className="ml-2">
                  {selection.metadata.awayTeam} @ {selection.metadata.homeTeam}
                </span>
              ) : (
                <span className="ml-2">{selection.metadata.awayTeam || selection.metadata.homeTeam}</span>
              )}
              {selection.metadata?.gameTime && (
                <span className="ml-3 text-blue-600 dark:text-blue-400 font-medium">{selection.metadata.gameTime}</span>
              )}
            </div>
          )}

          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border-l-4 border-slate-300 dark:border-slate-600">
            <span className="font-medium">Raw text:</span> &quot;{selection.rawText}&quot;
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(true)}
          className="ml-4 h-10 w-10 hover:bg-blue-100 dark:hover:bg-blue-900/30"
        >
          <Edit3 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}

export function ExtractionResults({
  results,
  uploadedFile,
  isLookingUpOdds,
  parlayComparison,
  parlayLinks,
}: ExtractionResultsProps) {
  const [selections, setSelections] = useState(results.selections)

  const updateSelection = (index: number, updated: BetSelection) => {
    const newSelections = [...selections]
    newSelections[index] = updated
    setSelections(newSelections)
  }

  const averageConfidence = selections.reduce((sum, sel) => sum + sel.confidence, 0) / selections.length

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Summary Card */}
      <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Extraction Results</h2>
          <ConfidenceIndicator confidence={averageConfidence} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          <div className="text-center">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
              <p className="text-slate-600 dark:text-slate-400 mb-1">Selections Found</p>
              <p className="font-bold text-2xl text-blue-600 dark:text-blue-400">{selections.length}</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
              <p className="text-slate-600 dark:text-slate-400 mb-1">Sportsbook</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {results.metadata.sportsbook || "Unknown"}
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
              <p className="text-slate-600 dark:text-slate-400 mb-1">Total Odds</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{results.metadata.totalOdds || "N/A"}</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
              <p className="text-slate-600 dark:text-slate-400 mb-1">Wager</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {results.metadata.wagerAmount || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {results.metadata.totalPayout && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200 dark:border-green-700">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Potential Payout:</span>
              <span className="text-xl font-bold text-green-700 dark:text-green-300">
                {results.metadata.totalPayout}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="selections" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="selections" className="text-sm font-medium">
            Selections
          </TabsTrigger>
          <TabsTrigger value="raw" className="text-sm font-medium">
            Raw Text
          </TabsTrigger>
        </TabsList>

        <TabsContent value="selections" className="space-y-6 mt-8">
          {selections.length > 0 ? (
            selections.map((selection, index) => (
              <SelectionCard
                key={selection.id}
                selection={selection}
                onUpdate={(updated) => updateSelection(index, updated)}
              />
            ))
          ) : (
            <Card className="p-12 text-center bg-slate-50 dark:bg-slate-900/50">
              <AlertCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">No selections found</h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                We couldn&apos;t extract any bet selections from this image. Try uploading a clearer screenshot or a
                different image.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="raw" className="mt-8">
          <Card className="p-8">
            <h3 className="font-semibold text-lg mb-6 text-slate-900 dark:text-slate-100">Raw Extracted Text</h3>
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-xl text-sm font-mono whitespace-pre-wrap border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
              {results.rawText || "No raw text available"}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center pt-4">
        <Button size="lg" disabled className="h-12 px-8">
          <TrendingUp className="h-5 w-5 mr-2" />
          Compare Odds (Coming Soon)
        </Button>
        <Button variant="outline" size="lg" disabled className="h-12 px-8 bg-transparent">
          Recreate Betslip (Coming Soon)
        </Button>
      </div>
    </div>
  )
}
