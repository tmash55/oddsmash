"use client"

import React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

interface OddsLayoutProps {
  children: React.ReactNode
  params: {
    sport: string
  }
}

export default function ArbLayout({ children, params }: OddsLayoutProps) {
  const isMobile = useMediaQuery("(max-width: 640px)")
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800/50">
      <div
        className={
          isMobile
            ? "w-full max-w-none px-0 py-2 space-y-3 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
            : "container py-6 space-y-4"
        }
      >
        {children}
      </div>
    </div>
  )
} 