"use client"

import React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { PropsNavigation } from "@/components/props/props-navigation"

interface OddsLayoutProps {
  children: React.ReactNode
  params: {
    sport: string
  }
}

export default function OddsLayout({ children, params }: OddsLayoutProps) {
  const { sport } = params
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const market = searchParams.get("market") || undefined
  
  // Extract the current category from the URL path using pathname
  // URL pattern is /[sport]/odds/[category]
  const currentCategory = pathname.split("/").slice(-1)[0].split("?")[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800/50">
      <div className="container py-6 space-y-4">
        <PropsNavigation 
          currentSport={sport}
          currentMarket={market}
          currentCategory={currentCategory}
        />
        {children}
      </div>
    </div>
  )
} 