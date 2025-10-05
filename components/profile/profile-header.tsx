"use client"

import { motion } from "framer-motion"
import { Settings, Trophy, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface ProfileHeaderProps {
  profileStrength: number
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  isMobile?: boolean
}

export function ProfileHeader({ profileStrength, sidebarOpen, setSidebarOpen, isMobile = false }: ProfileHeaderProps) {
  if (isMobile) {
    return (
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60 lg:hidden">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Manage your account</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-full border border-green-200 dark:border-green-800 shadow-sm"
              >
                <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">{profileStrength}%</span>
              </motion.div>

              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="h-9 w-9 p-0">
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-10"
    >
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-purple-500/25">
          <Settings className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">Manage your profile and preferences</p>
        </div>
      </div>

      <motion.div
        className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg"
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{profileStrength}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Profile Complete</p>
          </div>
        </div>
        <Progress value={profileStrength} className="h-2 bg-gray-200 dark:bg-gray-700" />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Complete to unlock all features</p>
      </motion.div>
    </motion.div>
  )
}
