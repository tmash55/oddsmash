"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, User, Shield, Zap, Palette, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TabType } from "@/types/profile"

interface ProfileSidebarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const tabs = [
  { id: "account" as TabType, label: "Account", icon: User },
  { id: "privacy" as TabType, label: "Privacy", icon: Shield },
  { id: "sportsbooks" as TabType, label: "Sportsbooks", icon: Zap },
  { id: "appearance" as TabType, label: "Appearance", icon: Palette },
  { id: "subscription" as TabType, label: "Subscription", icon: CreditCard },
]

export function ProfileSidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }: ProfileSidebarProps) {
  const TabButton = ({ tab, onClick }: { tab: (typeof tabs)[0]; onClick: () => void }) => {
    const Icon = tab.icon
    const isActive = activeTab === tab.id

    return (
      <motion.button
        className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-lg"
            : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md"
        }`}
        whileHover={{ scale: isActive ? 1 : 1.02, x: isActive ? 0 : 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
      >
        <div
          className={`p-2 rounded-xl ${
            isActive
              ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-medium">{tab.label}</span>
      </motion.button>
    )
  }

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 z-50 border-r border-gray-200 dark:border-gray-800 shadow-2xl"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Settings</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(false)}
                    className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-2">
                {tabs.map((tab) => (
                  <TabButton
                    key={tab.id}
                    tab={tab}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setSidebarOpen(false)
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="hidden lg:block"
      >
        <Card className="border-0 shadow-lg bg-white dark:bg-gray-900">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Personal Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tabs.map((tab) => (
              <TabButton key={tab.id} tab={tab} onClick={() => setActiveTab(tab.id)} />
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
