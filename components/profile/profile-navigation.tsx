"use client"

import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TabType } from "@/types/profile"

interface ProfileNavigationProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

const tabs = [
  { id: "account" as TabType, label: "Account" },
  { id: "privacy" as TabType, label: "Privacy" },
  { id: "sportsbooks" as TabType, label: "Sportsbooks" },
  { id: "appearance" as TabType, label: "Appearance" },
  { id: "subscription" as TabType, label: "Subscription" },
]

export function ProfileNavigation({ activeTab, setActiveTab }: ProfileNavigationProps) {
  const currentIndex = tabs.findIndex((tab) => tab.id === activeTab)
  const prevTab = currentIndex > 0 ? tabs[currentIndex - 1] : null
  const nextTab = currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : null

  return (
    <div className="lg:hidden flex items-center justify-between gap-3 mb-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => prevTab && setActiveTab(prevTab.id)}
        disabled={!prevTab}
        className="flex items-center gap-2 h-10 border-2 bg-white dark:bg-gray-900"
      >
        <ChevronLeft className="w-4 h-4" />
        {prevTab?.label}
      </Button>

      <div className="flex items-center gap-2">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              tab.id === activeTab ? "bg-blue-500 w-6" : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => nextTab && setActiveTab(nextTab.id)}
        disabled={!nextTab}
        className="flex items-center gap-2 h-10 border-2 bg-white dark:bg-gray-900"
      >
        {nextTab?.label}
        <ChevronLeft className="w-4 h-4 rotate-180" />
      </Button>
    </div>
  )
}
