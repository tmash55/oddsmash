"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Sparkles,
  Info,
  Trophy,
  Target,
  BarChart3,
  TrendingUp,
  Star
} from "lucide-react"
import { OddSmashScoreResult } from "@/lib/oddsmash-score-calculator"

interface EnhancedOddSmashScoreProps {
  scoreResult: OddSmashScoreResult
  isCompact?: boolean
  className?: string
}

export function EnhancedOddSmashScore({
  scoreResult,
  isCompact = false,
  className = ""
}: EnhancedOddSmashScoreProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const { totalScore, tier, hitRateScore, valueScore, dataQualityScore, breakdown, analytics, shareableData } = scoreResult



  if (isCompact) {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tier.color.bg} p-4 text-white shadow-lg ${className}`}>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4" />
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <span className="text-sm font-semibold opacity-90">OddSmash Score</span>
                  <Info className="w-3 h-3 opacity-70" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-64 text-sm">
                <p>
                  Enhanced scoring system that weighs hit rate data (45%) and value discovery (35%) to evaluate betslip quality from 0-100.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="text-2xl font-black mb-1">
            {totalScore}/100
          </div>
          <div className="text-sm opacity-75 font-medium">
            {tier.emoji} {tier.name}
          </div>
        </div>
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10"></div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Card className={`border-0 shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md ${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${tier.color.bg}`}>
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              OddSmash Score
            </CardTitle>

          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hero Score Display */}
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tier.color.bg} p-6 text-white shadow-lg`}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-4xl font-black mb-2">{totalScore}/100</div>
                  <div className="text-lg font-bold opacity-90 flex items-center gap-2">
                    <span className="text-2xl">{tier.emoji}</span>
                    {tier.name}
                  </div>
                  <div className="text-sm opacity-75 mt-1">{tier.description}</div>
                </div>
                <div className="text-right">
                  <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-white/80 hover:text-white hover:bg-white/10"
                      >
                        <Info className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl bg-gradient-to-br ${tier.color.bg}`}>
                            <span className="text-white text-lg">{tier.emoji}</span>
                          </div>
                          Score Breakdown - {tier.name}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 mt-4">
                        {/* Score Components */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-2xl">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{hitRateScore}/45</div>
                            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Hit Intelligence</div>
                            <div className="flex justify-center mt-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < Math.round((hitRateScore / 45) * 5) ? 'text-blue-500 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-2xl">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{valueScore}/35</div>
                            <div className="text-sm font-medium text-green-600 dark:text-green-400">Value Discovery</div>
                            <div className="flex justify-center mt-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < Math.round((valueScore / 35) * 5) ? 'text-green-500 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-2xl">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{dataQualityScore}/20</div>
                            <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Data Quality</div>
                            <div className="flex justify-center mt-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < Math.round((dataQualityScore / 20) * 5) ? 'text-purple-500 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Detailed Breakdown */}
                        <div className="space-y-4">
                          <div className="border-t pt-4">
                            <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Hit Rate Intelligence ({hitRateScore}/45)
                            </h4>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div className="flex justify-between">
                                <span>Recent Performance:</span>
                                <span className="font-medium">{breakdown.recentPerformance}/25</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Consistency:</span>
                                <span className="font-medium">{breakdown.consistency}/15</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Trend Analysis:</span>
                                <span className="font-medium">{breakdown.trendAnalysis}/5</span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <h4 className="font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Value Discovery ({valueScore}/35)
                            </h4>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div className="flex justify-between">
                                <span>Odds Value Edge:</span>
                                <span className="font-medium">{breakdown.oddsValueEdge}/20</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Line Shopping:</span>
                                <span className="font-medium">{breakdown.lineShoppingScore}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Market Efficiency:</span>
                                <span className="font-medium">{breakdown.marketEfficiency}/5</span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Data Quality ({dataQualityScore}/20)
                            </h4>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div className="flex justify-between">
                                <span>Data Completeness:</span>
                                <span className="font-medium">{breakdown.dataCompleteness}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Sample Size:</span>
                                <span className="font-medium">{breakdown.sampleSize}/5</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Alt Line Precision:</span>
                                <span className="font-medium">{breakdown.alternateLinePrecision}/5</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Analytics Summary */}
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
                          <h4 className="font-semibold mb-3">Key Analytics</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                              <span>Avg Hit Rate:</span>
                              <span className="font-medium">{analytics.avgHitRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>High Confidence:</span>
                              <span className="font-medium">{analytics.highConfidencePicks} picks</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Value Edge:</span>
                              <span className="font-medium">+{analytics.valueEdgePercent}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Books Beaten:</span>
                              <span className="font-medium">{analytics.booksBeaten}/{analytics.totalBooks}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Key Highlights */}
              {shareableData.highlights.length > 0 && (
                <div className="space-y-2">
                  {shareableData.highlights.slice(0, 3).map((highlight, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm font-medium opacity-90">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
                      {highlight}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Background decoration */}
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10"></div>
            <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-white/5"></div>
          </div>

          {/* Component Scores */}
          <div className="grid grid-cols-3 gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 cursor-help">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Hit Intelligence</span>
                  </div>
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{hitRateScore}/45</div>
                  <div className="flex mt-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < Math.round((hitRateScore / 45) * 5) ? 'text-blue-500 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Based on recent hit rates, consistency, and performance trends</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 cursor-help">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Value Discovery</span>
                  </div>
                  <div className="text-xl font-bold text-green-700 dark:text-green-300">{valueScore}/35</div>
                  <div className="flex mt-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < Math.round((valueScore / 35) * 5) ? 'text-green-500 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Odds value edge, line shopping opportunities, and market efficiency</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 cursor-help">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Data Quality</span>
                  </div>
                  <div className="text-xl font-bold text-purple-700 dark:text-purple-300">{dataQualityScore}/20</div>
                  <div className="flex mt-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < Math.round((dataQualityScore / 20) * 5) ? 'text-purple-500 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Data completeness, sample size, and custom calculations</p>
              </TooltipContent>
            </Tooltip>
          </div>


        </CardContent>
      </Card>
    </TooltipProvider>
  )
} 