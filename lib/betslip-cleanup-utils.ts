// Utility functions for cleaning up expired betslip selections

export interface BetslipSelection {
  id: string
  commence_time: string
  home_team: string
  away_team: string
  player_name?: string
  market_display?: string
  line?: number
  selection: string
}

export interface ExpiredSelectionInfo {
  selection: BetslipSelection
  minutesExpired: number
  reason: 'game_started' | 'game_finished'
}

/**
 * Check if a selection is expired based on commence_time
 * @param selection - The betslip selection to check
 * @param gracePeriodMinutes - Minutes after game start to still allow (default: 30)
 * @returns boolean indicating if selection is expired
 */
export function isSelectionExpired(
  selection: BetslipSelection, 
  gracePeriodMinutes: number = 30
): boolean {
  const now = new Date()
  const commenceTime = new Date(selection.commence_time)
  const gracePeriodEnd = new Date(commenceTime.getTime() + (gracePeriodMinutes * 60 * 1000))
  
  return now > gracePeriodEnd
}

/**
 * Get detailed information about expired selections
 * @param selections - Array of betslip selections
 * @param gracePeriodMinutes - Grace period in minutes (default: 30)
 * @returns Array of expired selection info
 */
export function getExpiredSelections(
  selections: BetslipSelection[], 
  gracePeriodMinutes: number = 30
): ExpiredSelectionInfo[] {
  const now = new Date()
  
  return selections
    .map(selection => {
      const commenceTime = new Date(selection.commence_time)
      const gracePeriodEnd = new Date(commenceTime.getTime() + (gracePeriodMinutes * 60 * 1000))
      
      if (now > gracePeriodEnd) {
        const minutesExpired = Math.floor((now.getTime() - gracePeriodEnd.getTime()) / (60 * 1000))
        
        // Determine reason - if more than 4 hours expired, likely game is finished
        const reason = minutesExpired > 240 ? 'game_finished' : 'game_started'
        
        return {
          selection,
          minutesExpired,
          reason
        }
      }
      
      return null
    })
    .filter(Boolean) as ExpiredSelectionInfo[]
}

/**
 * Filter out expired selections from an array
 * @param selections - Array of betslip selections
 * @param gracePeriodMinutes - Grace period in minutes (default: 30)
 * @returns Array of non-expired selections
 */
export function filterActiveSelections(
  selections: BetslipSelection[], 
  gracePeriodMinutes: number = 30
): BetslipSelection[] {
  return selections.filter(selection => !isSelectionExpired(selection, gracePeriodMinutes))
}

/**
 * Generate user-friendly message about expired selections
 * @param expiredInfo - Array of expired selection info
 * @returns Formatted message for the user
 */
export function generateExpiredMessage(expiredInfo: ExpiredSelectionInfo[]): string {
  if (expiredInfo.length === 0) return ""
  
  const gameStartedCount = expiredInfo.filter(info => info.reason === 'game_started').length
  const gameFinishedCount = expiredInfo.filter(info => info.reason === 'game_finished').length
  
  let message = `Found ${expiredInfo.length} expired selection${expiredInfo.length > 1 ? 's' : ''}: `
  
  const parts = []
  if (gameStartedCount > 0) {
    parts.push(`${gameStartedCount} game${gameStartedCount > 1 ? 's' : ''} started`)
  }
  if (gameFinishedCount > 0) {
    parts.push(`${gameFinishedCount} game${gameFinishedCount > 1 ? 's' : ''} finished`)
  }
  
  message += parts.join(', ')
  
  return message
}

/**
 * Format selection for display in cleanup dialogs
 * @param selection - The betslip selection
 * @returns Formatted string for display
 */
export function formatSelectionForDisplay(selection: BetslipSelection): string {
  const player = selection.player_name || 'Game'
  const market = selection.market_display || 'Bet'
  const line = selection.line ? ` ${selection.line}` : ''
  const matchup = `${selection.away_team} @ ${selection.home_team}`
  
  return `${player} ${selection.selection}${line} ${market} (${matchup})`
}

/**
 * Get time until a selection expires
 * @param selection - The betslip selection
 * @param gracePeriodMinutes - Grace period in minutes (default: 30)
 * @returns Object with time until expiration or null if already expired
 */
export function getTimeUntilExpiration(
  selection: BetslipSelection, 
  gracePeriodMinutes: number = 30
): { hours: number; minutes: number } | null {
  const now = new Date()
  const commenceTime = new Date(selection.commence_time)
  const gracePeriodEnd = new Date(commenceTime.getTime() + (gracePeriodMinutes * 60 * 1000))
  
  if (now >= gracePeriodEnd) return null
  
  const msUntilExpiration = gracePeriodEnd.getTime() - now.getTime()
  const hoursUntil = Math.floor(msUntilExpiration / (60 * 60 * 1000))
  const minutesUntil = Math.floor((msUntilExpiration % (60 * 60 * 1000)) / (60 * 1000))
  
  return { hours: hoursUntil, minutes: minutesUntil }
} 