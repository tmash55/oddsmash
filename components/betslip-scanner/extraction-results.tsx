"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit3, Check, X, AlertCircle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { ParlayComparison } from "./parlay-comparison"

interface BetSelection {
  id: string
  player?: string
  team?: string
  market: string
  line?: number
  betType: 'over' | 'under' | 'moneyline' | 'spread'
  sport: string
  confidence: number
  rawText: string
  metadata?: {
    odds?: string
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
    if (conf >= 0.8) return "text-green-600 bg-green-100"
    if (conf >= 0.6) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  const getLabel = (conf: number) => {
    if (conf >= 0.8) return "High"
    if (conf >= 0.6) return "Medium"
    return "Low"
  }

  return (
    <Badge variant="secondary" className={cn("text-xs", getColor(confidence))}>
      {getLabel(confidence)} ({Math.round(confidence * 100)}%)
    </Badge>
  )
}

function SelectionCard({ selection, onUpdate }: { 
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
      <Card className="p-4 border-primary/50">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Edit Selection</h4>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="player">Player/Team</Label>
              <Input
                id="player"
                value={editedSelection.player || editedSelection.team || ''}
                onChange={(e) => setEditedSelection({
                  ...editedSelection,
                  player: e.target.value
                })}
              />
            </div>
            <div>
              <Label htmlFor="market">Market</Label>
              <Input
                id="market"
                value={editedSelection.market}
                onChange={(e) => setEditedSelection({
                  ...editedSelection,
                  market: e.target.value
                })}
              />
            </div>
            <div>
              <Label htmlFor="betType">Bet Type</Label>
              <Select
                value={editedSelection.betType}
                onValueChange={(value: 'over' | 'under' | 'moneyline' | 'spread') => 
                  setEditedSelection({ ...editedSelection, betType: value })
                }
              >
                <SelectTrigger>
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
            <div>
              <Label htmlFor="line">Line</Label>
              <Input
                id="line"
                type="number"
                step="0.5"
                value={editedSelection.line || ''}
                onChange={(e) => setEditedSelection({
                  ...editedSelection,
                  line: parseFloat(e.target.value) || undefined
                })}
              />
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">
              {selection.player || selection.team || 'Unknown Player'}
            </h4>
            <ConfidenceIndicator confidence={selection.confidence} />
            {selection.metadata?.odds && (
              <Badge variant="outline" className="text-xs">
                {selection.metadata.odds}
              </Badge>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{selection.market}</span>
            {selection.line && (
              <span className="ml-2">
                {selection.betType === 'over' ? 'Over' : 
                 selection.betType === 'under' ? 'Under' : 
                 selection.betType} {selection.line}
              </span>
            )}
          </div>

          {/* Game Information */}
          {(selection.metadata?.awayTeam || selection.metadata?.homeTeam) && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Game:</span> 
              {selection.metadata.awayTeam && selection.metadata.homeTeam ? (
                <span className="ml-1">
                  {selection.metadata.awayTeam} @ {selection.metadata.homeTeam}
                </span>
              ) : (
                <span className="ml-1">
                  {selection.metadata.awayTeam || selection.metadata.homeTeam}
                </span>
              )}
              {selection.metadata?.gameTime && (
                <span className="ml-2 text-primary">
                  {selection.metadata.gameTime}
                </span>
              )}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            Raw text: "{selection.rawText}"
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(true)}
        >
          <Edit3 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}

export function ExtractionResults({ results, uploadedFile, isLookingUpOdds, parlayComparison, parlayLinks }: ExtractionResultsProps) {
  const [selections, setSelections] = useState(results.selections)

  const updateSelection = (index: number, updated: BetSelection) => {
    const newSelections = [...selections]
    newSelections[index] = updated
    setSelections(newSelections)
  }

  const averageConfidence = selections.reduce((sum, sel) => sum + sel.confidence, 0) / selections.length

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Extraction Results</h2>
          <ConfidenceIndicator confidence={averageConfidence} />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Selections Found</p>
            <p className="font-semibold text-lg">{selections.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Sportsbook</p>
            <p className="font-semibold">{results.metadata.sportsbook || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Odds</p>
            <p className="font-semibold">{results.metadata.totalOdds || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Wager</p>
            <p className="font-semibold">{results.metadata.wagerAmount || 'N/A'}</p>
          </div>
        </div>

        {results.metadata.totalPayout && (
          <div className="mt-4 p-3 bg-primary/5 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Potential Payout:</span>
              <span className="text-lg font-bold text-primary">{results.metadata.totalPayout}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="selections" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="selections">Selections</TabsTrigger>
          <TabsTrigger value="compare">Compare Odds</TabsTrigger>
          <TabsTrigger value="raw">Raw Text</TabsTrigger>
        </TabsList>
        
        <TabsContent value="selections" className="space-y-4">
          {selections.length > 0 ? (
            selections.map((selection, index) => (
              <SelectionCard
                key={selection.id}
                selection={selection}
                onUpdate={(updated) => updateSelection(index, updated)}
              />
            ))
          ) : (
            <Card className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No selections found</h3>
              <p className="text-muted-foreground">
                We couldn't extract any bet selections from this image. 
                Try uploading a clearer screenshot or a different image.
              </p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="compare">
          {parlayComparison ? (
            <ParlayComparison 
              parlayComparison={parlayComparison} 
              parlayLinks={parlayLinks || {}} 
            />
          ) : isLookingUpOdds ? (
            <Card className="p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Looking up current odds...</h3>
              <p className="text-muted-foreground">
                We're fetching the latest odds from all major sportsbooks to compare your parlay.
              </p>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Odds Comparison</h3>
              <p className="text-muted-foreground">
                No current odds data available. This could be because the games haven't started yet or the players weren't found in our database.
              </p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="raw">
          <Card className="p-6">
            <h3 className="font-medium mb-4">Raw Extracted Text</h3>
            <div className="bg-muted p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
              {results.rawText || 'No raw text available'}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button size="lg" disabled>
          <TrendingUp className="h-4 w-4 mr-2" />
          Compare Odds (Coming Soon)
        </Button>
        <Button variant="outline" size="lg" disabled>
          Recreate Betslip (Coming Soon)
        </Button>
      </div>
    </div>
  )
} 