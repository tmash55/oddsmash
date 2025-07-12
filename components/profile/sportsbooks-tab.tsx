"use client"

import { motion } from "framer-motion"
import { Zap, Check, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ProfileNavigation } from "./profile-navigation"
import { sportsbooks } from "@/data/sportsbooks"
import Image from "next/image"
import type { ProfileTabProps, TabType } from "@/types/profile"

interface SportsbooksTabProps extends ProfileTabProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

export function SportsbooksTab({ preferences, onSavePreference, activeTab, setActiveTab }: SportsbooksTabProps) {
  return (
    <div className="space-y-6">
      <ProfileNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-8">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            Preferred Sportsbooks
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Select your favorite sportsbooks to customize your experience and get the best odds
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sportsbooks
              .filter((sb) => sb.isActive)
              .map((sportsbook) => {
                const isSelected =
                  preferences.preferred_sportsbooks?.includes(sportsbook.id) ||
                  preferences.sportsbooks?.includes(sportsbook.id)

                return (
                  <motion.div
                    key={sportsbook.id}
                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 min-h-[120px] ${
                      isSelected
                        ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 shadow-lg ring-2 ring-green-500/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md bg-white dark:bg-gray-900"
                    }`}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const currentBooks = preferences.preferred_sportsbooks || []
                      const newBooks = isSelected
                        ? currentBooks.filter((id) => id !== sportsbook.id)
                        : [...currentBooks, sportsbook.id]
                      onSavePreference("preferred_sportsbooks", newBooks)
                    }}
                  >
                    <div className="flex flex-col items-center gap-3 h-full justify-center">
                      <div className="relative">
                        <Image
                          src={sportsbook.logo || "/placeholder.svg"}
                          alt={sportsbook.name}
                          width={48}
                          height={48}
                          className="object-contain"
                        />
                      </div>
                      <span className="text-sm font-semibold text-center leading-tight text-gray-900 dark:text-white">
                        {sportsbook.name}
                      </span>
                    </div>

                    {isSelected && (
                      <motion.div
                        className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl border border-blue-200 dark:border-blue-800"
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Star className="w-3 h-3 text-white" />
              </div>
              Pro Tip
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              Select multiple sportsbooks to compare odds and find the best payouts for your bets. OddSmash will
              highlight the highest odds across your preferred books and help you maximize your potential winnings.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}
