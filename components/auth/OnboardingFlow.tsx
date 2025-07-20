"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/libs/supabase/client"
import { useUserPreferences, STATE_CODES, LEGAL_BETTING_STATES } from "@/hooks/use-user-preferences"
import { sportsbooks } from "@/data/sportsbooks"
import { MapPin, CreditCard, Sparkles, ArrowRight, Check, X, TrendingUp, Camera, Brain } from "lucide-react"
import Image from "next/image"
import { useTheme } from "next-themes"

interface OnboardingFlowProps {
  onComplete: () => void
}

type OnboardingStep = "welcome" | "state" | "sportsbooks" | "complete"

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome")
  const [selectedState, setSelectedState] = useState<string>("")
  const [selectedSportsbooks, setSelectedSportsbooks] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const { setUserState, setSportsbooks, completeOnboarding, isAuthenticated, preferences } = useUserPreferences()
  const { theme } = useTheme()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Get most popular sportsbooks first
  const popularSportsbooks = sportsbooks.filter((sb) =>
    ["draftkings", "fanduel", "betmgm", "williamhill_us", "espnbet", "fanatics"].includes(sb.id),
  )
  const otherSportsbooks = sportsbooks.filter(
    (sb) => !["draftkings", "fanduel", "betmgm", "williamhill_us", "espnbet", "fanatics"].includes(sb.id),
  )
  const orderedSportsbooks = [...popularSportsbooks, ...otherSportsbooks]

  // Theme-based styles
  const isDark = theme === "dark"

  useEffect(() => {
    const pendingData = sessionStorage.getItem("pendingUserData")
    if (pendingData) {
      setUserData(JSON.parse(pendingData))
    }
  }, [])

  const handleStateSelection = async (stateCode: string) => {
    setSelectedState(stateCode)
    // Save state to database immediately if user is authenticated
    if (isAuthenticated) {
      await setUserState(stateCode)
    }
  }

  const handleSportsbookToggle = (sportsbookId: string) => {
    setSelectedSportsbooks((prev) =>
      prev.includes(sportsbookId) ? prev.filter((id) => id !== sportsbookId) : [...prev, sportsbookId],
    )
  }

  const handleSelectAll = () => {
    setSelectedSportsbooks(orderedSportsbooks.map((sb) => sb.id))
  }

  const handleSelectNone = () => {
    setSelectedSportsbooks([])
  }

  const savePreferencesToDatabase = async () => {
    try {
      if (!isAuthenticated) {
        console.log("No authenticated user found, completing locally")
        return true
      }

      // Use the new hook methods to save preferences
      let success = true

      if (selectedState) {
        success = success && (await setUserState(selectedState))
      }

      if (selectedSportsbooks.length > 0) {
        success = success && (await setSportsbooks(selectedSportsbooks))
      }

      // Mark onboarding as completed
      success = success && (await completeOnboarding())

      if (success) {
        sessionStorage.removeItem("pendingUserData")
      }

      return success
    } catch (error) {
      console.error("Error saving preferences:", error)
      return false
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)

    try {
      const saved = await savePreferencesToDatabase()

      if (saved) {
        toast({
          title: "Welcome to OddSmash! 🎉",
          description: "Your preferences have been saved. Let's start finding you the best odds!",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error saving preferences",
          description: "We'll use your local preferences for now. You can update them later in settings.",
        })
      }

      onComplete()
      router.push("/mlb/odds/player-props?market=home+runs")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Don't worry, we'll use your preferences locally for now.",
      })

      onComplete()
      router.push("/mlb/odds/player-props?market=home+runs")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    try {
      // Mark onboarding as completed even when skipping
      if (isAuthenticated) {
        await completeOnboarding()
      }
    } catch (error) {
      console.error("Error saving skip status:", error)
    }

    onComplete()
    router.push("/mlb/odds/player-props?market=home+runs")
  }

  const getStepProgress = () => {
    const steps = ["welcome", "state", "sportsbooks", "complete"]
    return ((steps.indexOf(currentStep) + 1) / steps.length) * 100
  }

  const renderWelcomeStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      {/* Skip button */}
      <div className="flex justify-end mb-6 md:mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="text-white/60 hover:text-white hover:bg-white/10 h-12 md:h-auto px-6 md:px-3 text-base md:text-sm rounded-2xl md:rounded-md"
        >
          Skip for now
        </Button>
      </div>

      <Card className="glassmorphic shadow-2xl backdrop-blur-sm md:rounded-xl rounded-none border-0 md:border min-h-screen md:min-h-0 flex flex-col justify-center relative overflow-hidden group">
        {/* Subtle animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-2xl animate-pulse-slow"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-green-400/10 to-emerald-500/10 rounded-full blur-2xl animate-pulse-medium"></div>
        </div>

        <CardHeader className="text-center pb-8 md:pb-6 px-8 md:px-6 pt-12 md:pt-6 relative z-10">
          <div className="w-24 h-24 md:w-20 md:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 md:mb-6">
            <Image
              src="/icon.png"
              alt="OddSmash Logo"
              width={48}
              height={48}
              className="object-contain md:w-10 md:h-10"
            />
          </div>
          <CardTitle className="text-4xl md:text-3xl font-bold text-white mb-4 md:mb-2">
            Welcome to OddSmash{userData?.firstName ? `, ${userData.firstName}` : ""} 👋
          </CardTitle>
          <CardDescription className="text-white/70 text-xl md:text-lg leading-relaxed">
            Let&apos;s customize your betting experience to help you find the smartest plays and best value.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-10 md:space-y-8 px-8 md:px-6 pb-12 md:pb-6 relative z-10">
          {/* Features grid */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-6 mb-10 md:mb-8">
            <div className="text-center space-y-4 md:space-y-3">
              <div className="w-16 h-16 md:w-12 md:h-12 bg-blue-500/20 rounded-2xl md:rounded-lg flex items-center justify-center mx-auto">
                <Brain className="w-8 h-8 md:w-6 md:h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white text-lg md:text-base">Smart Hit Rate Insights</h3>
              <p className="text-base md:text-sm text-white/60">
                See how players are trending and shop by hit rates like 5+ game streaks, 80% lines, and more.
              </p>
            </div>
            <div className="text-center space-y-4 md:space-y-3">
              <div className="w-16 h-16 md:w-12 md:h-12 bg-green-500/20 rounded-2xl md:rounded-lg flex items-center justify-center mx-auto">
                <TrendingUp className="w-8 h-8 md:w-6 md:h-6 text-green-400" />
              </div>
              <h3 className="font-semibold text-white text-lg md:text-base">Best Odds Comparison</h3>
              <p className="text-base md:text-sm text-white/60">
                Compare your picks across all major sportsbooks — get the highest payout, always.
              </p>
            </div>
            <div className="text-center space-y-4 md:space-y-3">
              <div className="w-16 h-16 md:w-12 md:h-12 bg-purple-500/20 rounded-2xl md:rounded-lg flex items-center justify-center mx-auto">
                <Camera className="w-8 h-8 md:w-6 md:h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white text-lg md:text-base">AI Betslip Scanner</h3>
              <p className="text-base md:text-sm text-white/60">
                Upload a screenshot and see how to improve your odds — or help your followers do the same.
              </p>
            </div>
          </div>

          {/* Amazon-style marketplace messaging */}
          <div className="text-center p-6 md:p-4 rounded-2xl md:rounded-lg mb-8 md:mb-6 bg-white/5">
            <p className="text-base md:text-sm text-gray-300 font-medium">
              Browse the best player props, add picks to your betslip, and check out with the top payout.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center space-y-6 md:space-y-4">
            <p className="text-white/60 font-medium text-lg md:text-base">
              ✨ Just 2 quick questions to personalize your experience.
            </p>
            <Button
              onClick={() => setCurrentStep("state")}
              size="lg"
              className="h-16 md:h-12 px-10 md:px-8 text-xl md:text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl md:rounded-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              Let&apos;s Get Started
              <ArrowRight className="w-6 h-6 md:w-5 md:h-5 ml-3 md:ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const renderStateStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-lg mx-auto"
    >
      {/* Progress bar */}
      <div className="mb-8 md:mb-6">
        <div className="flex justify-between text-base md:text-sm text-white/60 mb-4 md:mb-2">
          <span>Step 1 of 3</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-white/60 hover:text-white hover:bg-white/10 h-auto p-0 text-base md:text-sm"
          >
            Skip
          </Button>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 md:h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 md:h-2 rounded-full transition-all duration-300"
            style={{ width: `${getStepProgress()}%` }}
          />
        </div>
      </div>

      <Card className="glassmorphic shadow-2xl backdrop-blur-sm md:rounded-xl rounded-none border-0 md:border min-h-screen md:min-h-0 flex flex-col justify-center relative overflow-hidden">
        <CardHeader className="text-center px-8 md:px-6 pt-12 md:pt-6 pb-8 md:pb-6">
          <div className="w-20 h-20 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 md:mb-4">
            <MapPin className="w-10 h-10 md:w-8 md:h-8 text-white" />
          </div>
          <CardTitle className="text-3xl md:text-2xl text-white mb-4 md:mb-2">
            What state are you betting from?
          </CardTitle>
          <CardDescription className="text-white/70 text-lg md:text-base">
            We&apos;ll show you legal sportsbooks in your area
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 md:space-y-6 px-8 md:px-6 pb-12 md:pb-6">
          <Select value={selectedState} onValueChange={handleStateSelection}>
            <SelectTrigger className="bg-white/5 border-white/20 text-white h-16 md:h-12 text-lg md:text-base rounded-2xl md:rounded-md">
              <SelectValue placeholder="Select your state" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/10 max-h-60">
              <SelectItem value="none" className="text-white hover:bg-white/10">
                🌍 None / Outside US
              </SelectItem>
              {Object.entries(STATE_CODES)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([stateName, stateCode]) => (
                  <SelectItem key={stateCode} value={stateCode} className="text-white hover:bg-white/10">
                    <span className="flex items-center justify-between w-full">
                      {stateName.charAt(0).toUpperCase() + stateName.slice(1)}
                      {LEGAL_BETTING_STATES.includes(stateCode) && (
                        <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-400 border-green-500/30">
                          Legal
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {selectedState && selectedState !== "none" && !LEGAL_BETTING_STATES.includes(selectedState) && (
            <div className="p-6 md:p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl md:rounded-lg">
              <p className="text-base md:text-sm text-yellow-400 text-center">
                ⚠️ Sports betting isn&apos;t currently legal in{" "}
                {Object.entries(STATE_CODES).find(([_, code]) => code === selectedState)?.[0]}. You can still use
                OddSmash for research and analysis!
              </p>
            </div>
          )}

          <div className="flex gap-4 md:gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentStep("welcome")}
              className="flex-1 h-16 md:h-12 text-lg md:text-base border-white/20 text-white hover:bg-white/10 rounded-2xl md:rounded-md"
            >
              Back
            </Button>
            <Button
              onClick={() => setCurrentStep("sportsbooks")}
              disabled={!selectedState}
              className="flex-1 h-16 md:h-12 text-lg md:text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl md:rounded-md"
            >
              Continue
              <ArrowRight className="w-5 h-5 md:w-4 md:h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const renderSportsbooksStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      {/* Progress bar */}
      <div className="mb-6 md:mb-4">
        <div className="flex justify-between text-base md:text-sm text-white/60 mb-4 md:mb-2">
          <span>Step 2 of 3</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-white/60 hover:text-white hover:bg-white/10 h-auto p-0 text-base md:text-sm"
          >
            Skip
          </Button>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 md:h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 md:h-2 rounded-full transition-all duration-300"
            style={{ width: `${getStepProgress()}%` }}
          />
        </div>
      </div>

      <Card className="glassmorphic shadow-2xl backdrop-blur-sm md:rounded-xl rounded-none border-0 md:border min-h-screen md:min-h-0 flex flex-col justify-center relative overflow-hidden">
        <CardHeader className="text-center pb-6 md:pb-4 px-8 md:px-6 pt-12 md:pt-6">
          <div className="w-20 h-20 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 md:mb-4">
            <CreditCard className="w-10 h-10 md:w-8 md:h-8 text-white" />
          </div>
          <CardTitle className="text-3xl md:text-2xl text-white mb-4 md:mb-2">Which sportsbooks do you use?</CardTitle>
          <CardDescription className="text-white/70 text-lg md:text-base">
              We&apos;ll tailor your experience to show you the best payouts from your favorite sportsbooks — and highlight
            where better odds exist.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 md:space-y-4 px-8 md:px-6 pb-12 md:pb-6">
          {/* Quick actions - 2 column layout */}
          <div className="grid grid-cols-2 gap-4 md:gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={handleSelectAll}
              className="h-14 md:h-10 text-lg md:text-base border-white/20 text-white hover:bg-white/10 rounded-2xl md:rounded-md bg-transparent"
            >
              <Check className="w-5 h-5 md:w-4 md:h-4 mr-2" />
              Select All
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={handleSelectNone}
              className="h-14 md:h-10 text-lg md:text-base border-white/20 text-white hover:bg-white/10 rounded-2xl md:rounded-md bg-transparent"
            >
              <X className="w-5 h-5 md:w-4 md:h-4 mr-2" />
              Clear All
            </Button>
          </div>

          {/* Sportsbooks grid - Mobile-first responsive design */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-3 max-h-80 md:max-h-60 overflow-y-auto px-1">
            {orderedSportsbooks.map((sportsbook, index) => (
              <motion.div
                key={sportsbook.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`relative p-4 md:p-2 rounded-2xl md:rounded-lg border-2 transition-all cursor-pointer hover:scale-105 hover:shadow-lg min-h-[120px] md:min-h-[90px] ${
                  selectedSportsbooks.includes(sportsbook.id)
                    ? "bg-blue-500/20 border-blue-500/60 shadow-lg shadow-blue-500/25 ring-1 ring-blue-500/30"
                    : "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10 hover:shadow-white/10"
                }`}
                onClick={() => handleSportsbookToggle(sportsbook.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Logo */}
                <div
                  className={`aspect-square bg-white/10 rounded-xl md:rounded-md mb-2 md:mb-1 flex items-center justify-center overflow-hidden transition-all max-w-[48px] md:max-w-[32px] max-h-[48px] md:max-h-[32px] mx-auto ${
                    selectedSportsbooks.includes(sportsbook.id) ? "ring-1 ring-blue-500/30" : ""
                  }`}
                >
                  <Image
                    src={sportsbook.logo || "/placeholder.svg"}
                    alt={sportsbook.name}
                    width={32}
                    height={32}
                    className="object-contain md:w-6 md:h-6"
                  />
                </div>

                {/* Name */}
                <h3 className="text-sm md:text-xs font-medium text-white text-center leading-tight line-clamp-2">
                  {sportsbook.name}
                </h3>

                {/* Popular badge */}
                {popularSportsbooks.includes(sportsbook) && (
                  <Badge
                    variant="secondary"
                    className="absolute top-2 md:top-1 left-2 md:left-1 bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs px-1 py-0.5"
                  >
                    ⭐
                  </Badge>
                )}

                {/* Selection indicator */}
                {selectedSportsbooks.includes(sportsbook.id) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-blue-500/10 rounded-2xl md:rounded-lg"
                  >
                    <div className="w-8 h-8 md:w-6 md:h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 md:w-4 md:h-4 text-white" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Selection info and nudge */}
          <div className="space-y-3 md:space-y-2">
            <div className="text-base md:text-sm text-white/60 text-center">
              Selected {selectedSportsbooks.length} of {orderedSportsbooks.length} sportsbooks
            </div>
            <div className="text-sm md:text-xs text-blue-400 text-center font-medium px-4">
              💡 The more sportsbooks you select, the better your chances of finding max value.
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 md:gap-3 pt-4 md:pt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCurrentStep("state")}
              className="flex-1 h-16 md:h-12 text-lg md:text-base border-white/20 text-white hover:bg-white/10 rounded-2xl md:rounded-md"
            >
              Back
            </Button>
            <Button
              size="lg"
              onClick={async () => {
                // Save sportsbooks to database before proceeding
                if (isAuthenticated && selectedSportsbooks.length > 0) {
                  await setSportsbooks(selectedSportsbooks)
                }
                setCurrentStep("complete")
              }}
              className="flex-1 h-16 md:h-12 text-lg md:text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl md:rounded-md"
            >
              Continue
              <ArrowRight className="w-6 h-6 md:w-5 md:h-5 ml-2" />
            </Button>
          </div>

          {/* Secondary actions */}
          <div className="space-y-4 md:space-y-3">
            {/* No sportsbooks option */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="default"
                onClick={handleSelectNone}
                className="h-12 md:h-10 px-8 md:px-6 text-white/60 hover:text-white hover:bg-white/10 text-lg md:text-base rounded-2xl md:rounded-md"
              >
                I don&apos;t use any yet
              </Button>
            </div>

            {/* Helpful microcopy */}
            <div className="text-sm md:text-xs text-white/60 text-center px-4">
              You can change your sportsbook list anytime in your settings.
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const renderCompleteStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-lg mx-auto"
    >
      {/* Progress bar */}
      <div className="mb-8 md:mb-6">
        <div className="flex justify-between text-base md:text-sm text-white/60 mb-4 md:mb-2">
          <span>Step 3 of 3</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep("sportsbooks")}
            className="text-white/60 hover:text-white hover:bg-white/10 h-auto p-0 text-base md:text-sm"
          >
            ← Edit Info
          </Button>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 md:h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 md:h-2 rounded-full transition-all duration-300"
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <Card className="glassmorphic shadow-2xl backdrop-blur-sm md:rounded-xl rounded-none border-0 md:border min-h-screen md:min-h-0 flex flex-col justify-center relative overflow-hidden">
        <CardHeader className="text-center px-8 md:px-6 pt-12 md:pt-6 pb-8 md:pb-6">
          <div className="w-24 h-24 md:w-20 md:h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 md:mb-4">
            <Check className="w-12 h-12 md:w-10 md:h-10 text-white" />
          </div>
          <CardTitle className="text-3xl md:text-2xl text-white mb-4 md:mb-2">You&apos;re All Set!</CardTitle>
          <CardDescription className="text-white/70 text-lg md:text-base">
            Your personalized OddSmash experience is ready
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 md:space-y-6 px-8 md:px-6 pb-12 md:pb-6">
          {/* Celebratory personalization impact */}
          <div className="text-center space-y-4 md:space-y-2">
            <h3 className="text-2xl md:text-lg font-semibold text-white">
              🎉 You&apos;re ready to find the smartest bets, faster.
            </h3>
            <p className="text-base md:text-sm text-white/70">
              We&apos;ve tailored your experience based on your preferences.
            </p>
          </div>

          {/* Summary */}
          <div className="bg-white/5 rounded-2xl md:rounded-xl p-6 md:p-4 space-y-4 md:space-y-3">
            <div className="flex items-center justify-between text-base md:text-sm">
              <span className="text-white/60">Location:</span>
              <span className="text-white font-medium">
                {selectedState === "none"
                  ? "Outside US"
                  : Object.entries(STATE_CODES)
                      .find(([_, code]) => code === selectedState)?.[0]
                      ?.toUpperCase() || "Not set"}
                {selectedState && selectedState !== "none" && LEGAL_BETTING_STATES.includes(selectedState) && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                  >
                    Legal
                  </Badge>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-base md:text-sm">
              <span className="text-white/60">Sportsbooks:</span>
              <span className="text-white font-medium">{selectedSportsbooks.length} selected</span>
            </div>
          </div>

          {/* Pro upgrade hint */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl md:rounded-xl p-6 md:p-4">
            <h3 className="font-semibold text-white mb-3 md:mb-2 text-lg md:text-base">🚀 Ready to unlock more?</h3>
            <p className="text-base md:text-sm text-white/60 mb-4 md:mb-3">
              Unlock full hit rate history, AI betslip scanning, and powerful filters to go deeper and win smarter.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 h-12 md:h-8 px-6 md:px-4 text-base md:text-sm rounded-2xl md:rounded-md bg-transparent"
              onClick={() => router.push("/pricing")}
            >
              View Pro Features
            </Button>
          </div>

          {/* Single prominent CTA */}
          <div className="space-y-4 md:space-y-3">
            <Button
              onClick={handleComplete}
              disabled={isLoading}
              size="lg"
              className="w-full h-18 md:h-14 text-xl md:text-base bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-2xl md:rounded-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              {isLoading ? "Setting up..." : "Start Betting Smarter"}
              <Sparkles className="w-6 h-6 md:w-5 md:h-5 ml-3 md:ml-2" />
            </Button>

            {/* Reassuring microcopy */}
            <div className="text-sm md:text-xs text-white/60 text-center px-4">
              You can update your location or sportsbook list anytime from Settings.
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6 md:p-4">
      <AnimatePresence mode="wait">
        {currentStep === "welcome" && renderWelcomeStep()}
        {currentStep === "state" && renderStateStep()}
        {currentStep === "sportsbooks" && renderSportsbooksStep()}
        {currentStep === "complete" && renderCompleteStep()}
      </AnimatePresence>
    </div>
  )
}
