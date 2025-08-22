"use client"

import React from "react"

interface OddsLayoutProps {
  children: React.ReactNode
  params: {
    sport: string
  }
}

export default function EVLayout({ children, params }: OddsLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800/50">
      <div className="container py-6 space-y-4">
        {children}
      </div>
    </div>
  )
} 