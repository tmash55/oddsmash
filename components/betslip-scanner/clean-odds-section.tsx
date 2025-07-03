// Clean odds comparison section without background patterns
{/* Full-Width Odds Comparison Section - Spans Both Columns */}
<Card className="mt-6 border-0 shadow-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
  <CardHeader className="pb-4">
    <CardTitle className="text-xl font-bold flex items-center gap-2">
      <BarChart3 className="h-6 w-6 text-blue-600" />
      📊 Odds Comparison
    </CardTitle>
    <p className="text-gray-600 dark:text-gray-400 text-sm">
      Compare parlay odds across all sportsbooks - find the best value for your bet
    </p>
  </CardHeader>
  <CardContent>
    {(() => {
      // Calculate original betslip odds for comparison
      const originalTotalOdds = currentSelections.reduce((acc, sel) => {
        const odds = sel.original_odds
        return acc * (odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1)
      }, 1)
      const originalAmericanOdds = originalTotalOdds >= 2 ? Math.round((originalTotalOdds - 1) * 100) : Math.round(-100 / (originalTotalOdds - 1))
      
      const sortedResults = Object.entries(parlayResults)
        .filter(([_, result]) => result.hasAllSelections && result.parlayOdds !== null)
        .sort(([,a], [,b]) => (b.parlayOdds || 0) - (a.parlayOdds || 0))

      if (sortedResults.length === 0) {
        return (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No complete parlay odds available</h3>
            <p className="text-sm">Some selections may not be found at sportsbooks</p>
          </div>
        )
      }

      // Find the best odds for scaling the bars
      const bestOddsValue = sortedResults[0][1].parlayOdds!
      
      return (
        <div className="space-y-4">
          {sortedResults.map(([sportsbookId, result], index) => {
            const sportsbookInfo = getSportsbookInfo(sportsbookId)
            const isBest = index === 0
            const currentOdds = result.parlayOdds!
            
            // Calculate percentage improvement over original
            const currentPayout = currentOdds > 0 ? currentOdds / 100 * 100 : 100 / Math.abs(currentOdds) * 100
            const originalPayout = originalAmericanOdds > 0 ? originalAmericanOdds / 100 * 100 : 100 / Math.abs(originalAmericanOdds) * 100
            const percentageImprovement = ((currentPayout - originalPayout) / originalPayout) * 100
            
            // Calculate bar width (relative to best odds)
            const barWidth = Math.max((Math.abs(currentOdds) / Math.abs(bestOddsValue)) * 100, 15)
            
            return (
              <div
                key={sportsbookId}
                className={`relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-md ${
                  isBest
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800'
                    : hasDeepLinking(sportsbookId)
                    ? 'bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50 border-blue-200/60 dark:from-blue-950/10 dark:via-indigo-950/10 dark:to-purple-950/10 dark:border-blue-800/30'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                }`}
              >
                {/* Animated Progress Bar */}
                <div 
                  className={`absolute left-0 top-0 h-full transition-all duration-1000 ease-out ${
                    isBest
                      ? 'bg-gradient-to-r from-green-200/40 to-emerald-200/40 dark:from-green-900/20 dark:to-emerald-900/20'
                      : hasDeepLinking(sportsbookId)
                      ? 'bg-gradient-to-r from-blue-200/40 to-indigo-200/40 dark:from-blue-900/20 dark:to-indigo-900/20'
                      : 'bg-gradient-to-r from-gray-200/40 to-gray-300/40 dark:from-gray-700/20 dark:to-gray-600/20'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
                
                {/* Content */}
                <div className="relative z-10 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left Side - Sportsbook Info */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex-shrink-0">
                        <img
                          src={sportsbookInfo.logo || "/placeholder.svg"}
                          alt={sportsbookInfo.name}
                          className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {sportsbookInfo.name}
                          </h3>
                          {hasDeepLinking(sportsbookId) && !isBest && (
                            <Zap className="h-4 w-4 text-blue-500 opacity-70" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {isBest && (
                            <Badge className="bg-green-600 text-white text-xs font-semibold">
                              🏆 BEST ODDS
                            </Badge>
                          )}
                          {percentageImprovement > 0 && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs font-semibold ${
                                percentageImprovement > 20 
                                  ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/20 dark:text-green-400' 
                                  : percentageImprovement > 10
                                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/20 dark:text-blue-400'
                                  : 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400'
                              }`}
                            >
                              📈 +{percentageImprovement.toFixed(1)}% better
                            </Badge>
                          )}
                        </div>
                        {percentageImprovement > 5 && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {percentageImprovement.toFixed(1)}% more payout than your original slip
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Right Side - Odds & Action */}
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-right">
                        <div className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
                          {formatOddsClean(currentOdds)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          $100 wins ${(100 * (currentOdds > 0 ? currentOdds / 100 : 100 / Math.abs(currentOdds) - 1)).toFixed(0)}
                        </div>
                      </div>
                      <Button
                        size="lg"
                        variant={isBest ? "default" : "outline"}
                        className={`px-6 py-3 font-semibold ${
                          isBest 
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                            : hasDeepLinking(sportsbookId)
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-blue-400 shadow-md'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => handlePlaceBet(sportsbookId)}
                      >
                        {hasDeepLinking(sportsbookId) ? (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Quick Bet
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Place Bet
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )
    })()}
  </CardContent>
</Card> 