"use client"

import React from "react"
import { ScannedBetslipView } from "../betslip-scanner/scanned-betslip-view"

interface BetslipViewProps {
  betslip: any
  selections: any[]
  user: any
  hitRatesData?: Record<string, any>
  isOwner?: boolean
  isPublic?: boolean
  isScanned?: boolean
}

export function BetslipView({
  betslip,
  selections,
  user,
  hitRatesData,
  isOwner = false,
  isPublic = false,
  isScanned = true,
}: BetslipViewProps) {
  // For now, we'll just wrap the ScannedBetslipView component
  // This allows us to get the route working immediately
  // Later we can differentiate the UI based on isScanned prop
  
  return (
    <ScannedBetslipView
      betslip={betslip}
      selections={selections}
      user={user}
      hitRatesData={hitRatesData}
      isOwner={isOwner}
      isPublic={isPublic}
    />
  )
} 