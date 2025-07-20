"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useBetslip } from "@/contexts/betslip-context"
import { ExpiredCleanupDialog } from "./expired-cleanup-dialog"

interface ExpiredCleanupButtonProps {
  betslipId: string
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export function ExpiredCleanupButton({
  betslipId,
  className,
  variant = "outline",
  size = "sm"
}: ExpiredCleanupButtonProps) {
  const { getExpiredSelections, removeExpiredSelections, removeAllExpiredSelections } = useBetslip()
  const [showDialog, setShowDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [expiredSelections, setExpiredSelections] = useState(() => getExpiredSelections(betslipId))

  // Update expired selections when betslipId changes or periodically
  useEffect(() => {
    const updateExpiredSelections = () => {
      setExpiredSelections(getExpiredSelections(betslipId))
    }

    updateExpiredSelections()

    // Check every minute for newly expired selections
    const interval = setInterval(updateExpiredSelections, 60000)
    return () => clearInterval(interval)
  }, [betslipId, getExpiredSelections])

  const handleRemoveExpired = async (selectionIds: string[]) => {
    setIsLoading(true)
    try {
      await removeExpiredSelections(betslipId, selectionIds)
      setExpiredSelections(getExpiredSelections(betslipId))
    } catch (error) {
      console.error('Error removing expired selections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveAll = async () => {
    setIsLoading(true)
    try {
      await removeAllExpiredSelections(betslipId)
      setExpiredSelections(getExpiredSelections(betslipId))
    } catch (error) {
      console.error('Error removing all expired selections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render if no expired selections
  if (expiredSelections.length === 0) return null

  const gameStartedCount = expiredSelections.filter(info => info.reason === 'game_started').length
  const gameFinishedCount = expiredSelections.filter(info => info.reason === 'game_finished').length

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`relative ${className}`}
        onClick={() => setShowDialog(true)}
      >
        <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
        Clean Up Expired
        <Badge 
          variant="secondary" 
          className="ml-2 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
        >
          {expiredSelections.length}
        </Badge>
      </Button>

      <ExpiredCleanupDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        expiredSelections={expiredSelections}
        onRemoveExpired={handleRemoveExpired}
        onRemoveAll={handleRemoveAll}
        isLoading={isLoading}
      />
    </>
  )
}

// Compact version for tight spaces
export function ExpiredCleanupBadge({
  betslipId,
  className,
  onClick
}: {
  betslipId: string
  className?: string
  onClick?: () => void
}) {
  const { getExpiredSelections } = useBetslip()
  const [expiredCount, setExpiredCount] = useState(() => getExpiredSelections(betslipId).length)

  useEffect(() => {
    const updateExpiredCount = () => {
      setExpiredCount(getExpiredSelections(betslipId).length)
    }

    updateExpiredCount()
    const interval = setInterval(updateExpiredCount, 60000)
    return () => clearInterval(interval)
  }, [betslipId, getExpiredSelections])

  if (expiredCount === 0) return null

  return (
    <Badge
      variant="outline"
      className={`cursor-pointer border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30 ${className}`}
      onClick={onClick}
    >
      <Clock className="h-3 w-3 mr-1" />
      {expiredCount} expired
    </Badge>
  )
} 