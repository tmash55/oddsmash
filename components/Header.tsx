"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronDown,
  Menu,
  BarChart3,
  LineChart,
  ChevronRight,
  Home,
  Activity,
  Crown,
  User,
  LogOut,
  Sparkles,
  X,
  Receipt,
  Bell,
  Star,
  TrendingUp,
  Settings,
  HelpCircle,
  BookOpen,
  Target,
  Trophy,
  Users,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { useAuth } from "@/components/auth/auth-provider"
import { useBetslip } from "@/contexts/betslip-context"
import { ThemeToggle } from "./theme-toggle"
import { sports } from "@/data/sports-data"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useEffect, useState } from "react"
import { createClient } from "@/libs/supabase/client"

// Profile interface matching the database schema
interface Profile {
  id: string
  email?: string
  first_name?: string
  last_name?: string
  name?: string
  avatar_url?: string
  phone?: string
  state?: string
  created_at: string
  updated_at: string
}

interface UserPreferences {
  subscription_tier?: string
  theme?: string
  notifications_enabled?: boolean
  public_profile?: boolean
}

export function Header() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isLeftSheetOpen, setIsLeftSheetOpen] = React.useState(false)
  const [isRightSheetOpen, setIsRightSheetOpen] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState<string | null>(null)
  const [logoError, setLogoError] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { betslips } = useBetslip()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Filter active sports
  const activeSports = sports.filter((sport) => sport.active)

  // Calculate total selections across all betslips
  const totalSelections = betslips?.reduce((total, betslip) => total + betslip.selections.length, 0) || 0

  // Handle scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Load user profile data
  useEffect(() => {
    if (!user) {
      setProfile(null)
      setPreferences({})
      setLoading(false)
      return
    }

    async function loadProfileData() {
      try {
        // Load profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Error loading profile:", profileError)
        }

        // Load preferences
        const { data: preferencesData, error: preferencesError } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("id", user.id)
          .single()

        if (preferencesError && preferencesError.code !== "PGRST116") {
          console.error("Error loading preferences:", preferencesError)
        }

        setProfile(
          profileData || {
            id: user.id,
            email: user.email || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        )
        setPreferences(preferencesData || {})
      } catch (error) {
        console.error("Error loading profile data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [user, supabase])

  // Get user initials matching profile page logic
  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    }
    if (profile?.name) {
      const names = profile.name.split(" ")
      return names.length > 1 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : names[0][0].toUpperCase()
    }
    return profile?.email?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"
  }

  // Get display name matching profile page logic
  const getDisplayName = () => {
    if (profile?.name) return profile.name
    if (profile?.first_name && profile?.last_name) return `${profile.first_name} ${profile.last_name}`
    if (profile?.first_name) return profile.first_name
    if (profile?.email) return profile.email.split("@")[0]
    if (user?.email) return user.email.split("@")[0]
    return "User"
  }

  // Fantasy items (for both public and authenticated users)
  const fantasyItems = [
    {
      title: "ADP Tool",
      description: "Compare Average Draft Position across platforms",
      href: "/fantasy/football/adp-smashboard",
      icon: <Trophy className="h-4 w-4 text-purple-600" />,
    },
  ]

  // Public navigation items (when user is not signed in) - mobile sheet uses these
  const publicNavigationItems = [
    {
      title: "Betting",
      href: "#",
      icon: <Star className="h-5 w-5 text-blue-600" />,
      isActive:
        pathname?.includes("/odds/") ||
        pathname?.startsWith("/betslip-scanner") ||
        pathname?.startsWith("/ev") ||
        pathname?.startsWith("/arbitrage"),
      description: "Discover our powerful tools",
      children: [
        {
          title: "Smash Screen",
          description: "Player Props and Game Lines",
          href: `/mlb/odds/player-props?market=home+runs`,
          icon: <BarChart3 className="h-4 w-4 text-blue-600" />,
        },
        {
          title: "Game Lines",
          description: "Moneyline, Spread, Totals",
          href: `/mlb/odds/game-lines?market=h2h`,
          icon: <LineChart className="h-4 w-4 text-blue-600" />,
        },
        {
          title: "EV Plays",
          description: "Expected value betting opportunities",
          href: "/ev",
          icon: <TrendingUp className="h-4 w-4 text-emerald-600" />,
        },
        {
          title: "Arbitrage",
          description: "Risk-free edges across books",
          href: "/arbitrage",
          icon: <BarChart3 className="h-4 w-4 text-emerald-600" />,
        },
        {
          title: "Promo Finder",
          description: "Claim partner offers",
          href: "/promo-finder",
          icon: <Star className="h-4 w-4 text-yellow-600" />,
        },
        {
          title: "Betslip Scanner",
          description: "Scan and analyze your betslips instantly",
          href: "/betslip-scanner",
          icon: <Sparkles className="h-4 w-4 text-orange-600" />,
        },
      ],
    },
    {
      title: "Insights",
      href: "#",
      icon: <Activity className="h-5 w-5 text-green-600" />,
      isActive: pathname?.includes("/hit-rates") || pathname?.startsWith("/trackers"),
      description: "Analytics and leaderboards",
      children: [
        {
          title: "Hit Rates",
          description: "Player prop trends",
          href: `/mlb/hit-rates?market=hits`,
          icon: <Activity className="h-4 w-4 text-green-600" />,
        },
      ],
    },
    {
      title: "Fantasy",
      href: "#",
      icon: <Users className="h-5 w-5 text-purple-600" />,
      isActive: pathname?.startsWith("/fantasy"),
      description: "Fantasy football tools and analytics",
      children: fantasyItems,
    },
  ]

  // Tracker items (for authenticated users)
  const trackerItems = [
    {
      title: "KOTP Leaderboard",
      description: "Track the King of the Playoffs",
      href: "/trackers/kotp-leaderboard",
      icon: <Crown className="h-4 w-4 text-yellow-600" />,
    },
    {
      title: "KOTD Leaderboard",
      description: "Track MLB home runs for King of the Diamond",
      href: "/trackers/kotd-leaderboard",
      icon: <Crown className="h-4 w-4 text-orange-600" />,
    },
    {
      title: "PRA Leaderboard",
      description: "Track PRA stats for NBA games",
      href: "/trackers/pra-leaderboard",
      icon: <TrendingUp className="h-4 w-4 text-blue-600" />,
    },
  ]

  const activeTrackerItems = trackerItems.filter((item) => !/kotp|kotc|pra/i.test(item.href))

  // Authenticated navigation items
  const authenticatedNavigationItems = [
    {
      title: "Home",
      href: "/",
      icon: <Home className="h-5 w-5 text-blue-600" />,
      isActive: pathname === "/",
      description: "Dashboard and overview",
    },
    {
      title: "Smash Screen",
      href: "/mlb/odds/player-props?market=home+runs",
      icon: <Target className="h-5 w-5 text-purple-600" />,
      isActive: pathname?.includes("/odds/player-props"),
      description: "Compare every book in seconds to find your edge",
    },
    {
      title: "Scanner",
      href: "/betslip-scanner",
      icon: <Sparkles className="h-5 w-5 text-orange-600" />,
      isActive: pathname?.startsWith("/betslip-scanner"),
      description: "Scan and analyze betslips",
    },
    {
      title: "Hit Rates",
      href: "/mlb/hit-rates?market=hits",
      icon: <Activity className="h-5 w-5 text-green-600" />,
      isActive: pathname?.includes("/hit-rates") || pathname?.startsWith("/hit-sheets"),
      description: "Track player prop hit rates and trends",
    },
    // Parlay Builder removed
    {
      title: "Trackers",
      href: "#",
      icon: <Crown className="h-5 w-5 text-yellow-600" />,
      isActive: pathname?.startsWith("/trackers"),
      description: "DraftKings King of the * trackers",
      children: activeTrackerItems,
    },
    {
      title: "Fantasy",
      href: "#",
      icon: <Users className="h-5 w-5 text-purple-600" />,
      isActive: pathname?.startsWith("/fantasy"),
      description: "Fantasy football tools and analytics",
      children: fantasyItems,
    },
  ]

  // Mobile navigation items (excluding Home)
  const mobileNavigationItems = [
    {
      title: "Smash Screen",
      href: "/mlb/odds/player-props?market=home+runs",
      icon: <Target className="h-5 w-5 text-purple-600" />,
      isActive: pathname?.includes("/odds/player-props"),
      description: "Compare every book in seconds to find your edge",
    },
    {
      title: "Scanner",
      href: "/betslip-scanner",
      icon: <Sparkles className="h-5 w-5 text-orange-600" />,
      isActive: pathname?.startsWith("/betslip-scanner"),
      description: "Scan and analyze betslips",
    },
    {
      title: "Hit Rate",
      href: "/mlb/hit-rates?market=hits",
      icon: <Activity className="h-5 w-5 text-green-600" />,
      isActive: pathname?.includes("/hit-rates") || pathname?.startsWith("/hit-sheets"),
      description: "Track player prop hit rates and trends",
    },
    // Add EV and Arbitrage for mobile too
    {
      title: "EV Plays",
      href: "/ev",
      icon: <TrendingUp className="h-5 w-5 text-green-600" />,
      isActive: pathname?.startsWith("/ev"),
      description: "Expected value opportunities",
    },
    {
      title: "Arbitrage",
      href: "/arbitrage",
      icon: <BarChart3 className="h-5 w-5 text-emerald-600" />,
      isActive: pathname?.startsWith("/arbitrage"),
      description: "Risk-free edges",
    },
    {
      title: "Promo Finder",
      href: "/promo-finder",
      icon: <Star className="h-5 w-5 text-yellow-600" />,
      isActive: pathname?.startsWith("/promo-finder"),
      description: "Claim partner offers",
    },
    {
      title: "Trackers",
      href: "#",
      icon: <Crown className="h-5 w-5 text-yellow-600" />,
      isActive: pathname?.startsWith("/trackers"),
      description: "DraftKings King of the * trackers",
      children: activeTrackerItems,
    },
    {
      title: "Fantasy",
      href: "#",
      icon: <Users className="h-5 w-5 text-purple-600" />,
      isActive: pathname?.startsWith("/fantasy"),
      description: "Fantasy football tools and analytics",
      children: fantasyItems,
    },
  ]

  // Choose navigation items based on auth state and platform
  const navigationItems = user
    ? isMobile
      ? mobileNavigationItems
      : authenticatedNavigationItems
    : publicNavigationItems

  // Public features for marketing dropdown
  const publicFeatures = [
    {
      title: "Player Props Comparison",
      description: "Compare odds across all major sportsbooks instantly",
      href: "#features",
      icon: <BarChart3 className="h-4 w-4 text-blue-600" />,
    },
    {
      title: "Hit Rate Analytics",
      description: "Advanced player performance and trend analysis",
      href: "/mlb/hit-rates?market=hits",
      icon: <Activity className="h-4 w-4 text-green-600" />,
    },
    {
      title: "Betslip Scanner",
      description: "Scan and analyze betslips with AI technology",
      href: "#features",
      icon: <Sparkles className="h-4 w-4 text-orange-600" />,
    },
    {
      title: "Live Trackers",
      description: "Real-time leaderboards and competition tracking",
      href: "#features",
      icon: <Crown className="h-4 w-4 text-yellow-600" />,
    },
  ]

  // Conditional components based on mobile state
  const HeaderComponent = isMobile ? "header" : motion.header
  const MotionDiv = isMobile ? "div" : motion.div

  return (
    <HeaderComponent
      className={cn(
        "sticky top-0 z-50 w-full backdrop-blur-xl transition-all duration-500",
        isScrolled
          ? "bg-background/90 supports-[backdrop-filter]:bg-background/80 border-b border-border/50 shadow-sm"
          : "bg-background/95 supports-[backdrop-filter]:bg-background/90",
      )}
      {...(!isMobile && {
        initial: { y: -100 },
        animate: { y: 0 },
        transition: { duration: 0.6, ease: "easeOut" },
      })}
    >
      {/* Subtle gradient background - Only on desktop */}
      {!isMobile && (
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/98 to-background/95 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-0 left-1/4 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"
            animate={{
              x: [0, 20, 0],
              y: [0, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-0 right-1/4 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl"
            animate={{
              x: [0, -20, 0],
              y: [0, 10, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>
      )}

      <div className="container h-16 items-center relative z-10">
        {/* Desktop Layout */}
        <div className="hidden md:grid grid-cols-3 h-16 items-center">
          {/* Logo - Left column */}
          <div className="flex items-center">
            <MotionDiv {...(!isMobile && { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } })}>
              <Link href="/" className="flex items-center group">
                {!logoError ? (
                  <div className="relative w-9 h-9 rounded-xl overflow-hidden group-hover:shadow-lg transition-shadow duration-300">
                    <Image
                      src="/logo.png"
                      alt="OddSmash Logo"
                      width={36}
                      height={36}
                      className="object-contain"
                      priority
                      onError={() => {
                        console.error("Logo failed to load from /logo.png")
                        setLogoError(true)
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">OS</span>
                  </div>
                )}
              </Link>
            </MotionDiv>
          </div>

          {/* Navigation - Center column */}
          <div className="flex justify-center">
            <NavigationMenu>
              <NavigationMenuList className="flex space-x-1">
                {/* Betting */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      "px-4 py-2 h-10 rounded-xl font-medium transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 data-[state=open]:bg-blue-50 dark:data-[state=open]:bg-blue-950/50 text-sm",
                      (pathname?.includes("/odds/") || pathname?.startsWith("/parlay-builder") || pathname?.startsWith("/betslip-scanner") || pathname?.startsWith("/history")) &&
                        "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
                    )}
                  >
                    Betting
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="w-[380px] p-3">
                      <div className="space-y-2">
                        <NavigationMenuLink asChild>
                          <Link href="/promo-finder" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors no-underline outline-none">
                            <Star className="h-4 w-4 text-yellow-600" />
                            <div>
                              <div className="font-medium text-sm">Promo Finder</div>
                              <p className="text-xs text-muted-foreground line-clamp-1">Claim partner offers</p>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link href={`/mlb/odds/player-props?market=home+runs`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors no-underline outline-none">
                            <BarChart3 className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="font-medium text-sm">Smash Screen</div>
                              <p className="text-xs text-muted-foreground line-clamp-1">Player Props and Game Lines</p>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link href={`/mlb/odds/game-lines?market=h2h`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors no-underline outline-none">
                            <LineChart className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="font-medium text-sm">Game Lines</div>
                              <p className="text-xs text-muted-foreground line-clamp-1">Moneyline, Spread, Totals</p>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link href="/ev" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors no-underline outline-none">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="font-medium text-sm">EV Plays</div>
                              <p className="text-xs text-muted-foreground line-clamp-1">Expected value opportunities</p>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link href="/arbitrage" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors no-underline outline-none">
                            <BarChart3 className="h-4 w-4 text-emerald-600" />
                            <div>
                              <div className="font-medium text-sm">Arbitrage</div>
                              <p className="text-xs text-muted-foreground line-clamp-1">Risk-free edges across books</p>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                        {/* Parlay Builder removed */}
                        <NavigationMenuLink asChild>
                          <Link href="/betslip-scanner" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors no-underline outline-none">
                            <Sparkles className="h-4 w-4 text-orange-600" />
                            <div>
                              <div className="font-medium text-sm">Betslip Scanner</div>
                              <p className="text-xs text-muted-foreground line-clamp-1">Scan and analyze slips</p>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </div>
                    </motion.div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Insights */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      "px-4 py-2 h-10 rounded-xl font-medium transition-all duration-300 hover:bg-green-50 dark:hover:bg-green-950/50 data-[state=open]:bg-green-50 dark:data-[state=open]:bg-green-950/50 text-sm",
                      (pathname?.includes("/hit-rates") || pathname?.startsWith("/trackers")) &&
                        "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300",
                    )}
                  >
                    Insights
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="w-[380px] p-3">
                      <div className="space-y-2">
                        <NavigationMenuLink asChild>
                          <Link href={`/mlb/hit-rates?market=hits`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors no-underline outline-none">
                            <Activity className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="font-medium text-sm">Hit Rates</div>
                              <p className="text-xs text-muted-foreground line-clamp-1">Player prop trends</p>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                        {activeTrackerItems.map((item) => (
                          <NavigationMenuLink key={item.title} asChild>
                            <Link href={item.href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors no-underline outline-none">
                              {item.icon}
                              <div>
                                <div className="font-medium text-sm">{item.title}</div>
                                <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </motion.div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Fantasy */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      "px-4 py-2 h-10 rounded-xl font-medium transition-all duration-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 data-[state=open]:bg-purple-50 dark:data-[state=open]:bg-purple-950/50 text-sm",
                      pathname?.startsWith("/fantasy") && "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
                    )}
                  >
                    Fantasy
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="w-[380px] p-3">
                      <div className="space-y-2">
                        {fantasyItems.map((item) => (
                          <NavigationMenuLink key={item.title} asChild>
                            <Link href={item.href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors no-underline outline-none">
                              {item.icon}
                              <div>
                                <div className="font-medium text-sm">{item.title}</div>
                                <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </motion.div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Learn dropdown removed */}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right column - Cart and Account */}
          <div className="flex justify-end items-center space-x-3">
            {/* Betslip Cart - Only show for authenticated users */}
            {user && (
              <MotionDiv {...(!isMobile && { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } })}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/betslip")}
                  className="relative h-10 w-10 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-300"
                >
                  <Receipt className="h-5 w-5" />
                  {totalSelections > 0 &&
                    (isMobile ? (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                        {totalSelections}
                      </span>
                    ) : (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg"
                      >
                        {totalSelections}
                      </motion.span>
                    ))}
                </Button>
              </MotionDiv>
            )}

            {/* User Account */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <MotionDiv {...(!isMobile && { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } })}>
                    <Button
                      variant="ghost"
                      className="relative h-10 px-3 rounded-xl hover:bg-muted transition-all duration-300"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 ring-2 ring-background shadow-sm">
                          <AvatarImage
                            src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                            alt={profile?.email || user?.email || ""}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden lg:block text-left">
                          <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
                          <p className="text-xs text-muted-foreground">{preferences?.subscription_tier || "Free"}</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Button>
                  </MotionDiv>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2">
                  <DropdownMenuLabel className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                        <AvatarImage
                          src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                          alt={profile?.email || user?.email || ""}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-none truncate">{getDisplayName()}</p>
                        <p className="text-xs text-muted-foreground truncate mt-1">{profile?.email || user?.email}</p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          {preferences?.subscription_tier || "Free Plan"}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer p-3 rounded-lg">
                      <User className="mr-3 h-4 w-4" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/history" className="cursor-pointer p-3 rounded-lg">
                      <Receipt className="mr-3 h-4 w-4" />
                      <span>Slip History</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/notifications" className="cursor-pointer p-3 rounded-lg">
                      <Bell className="mr-3 h-4 w-4" />
                      <span>Notifications</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Theme</span>
                      <ThemeToggle />
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 dark:text-red-400 p-3 rounded-lg"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <MotionDiv {...(!isMobile && { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } })}>
                  <Button
                    asChild
                    className="rounded-xl px-5 h-10 font-semibold text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200 border-0"
                  >
                    <Link href="/sign-up" className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Start Smashing
                    </Link>
                  </Button>
                </MotionDiv>
                <MotionDiv {...(!isMobile && { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } })}>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="rounded-xl px-4 h-10 font-medium border-border/50 hover:border-border transition-all duration-200 bg-transparent"
                  >
                    <Link href="/sign-in" className="text-sm">
                      Sign In
                    </Link>
                  </Button>
                </MotionDiv>
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>

        {/* Mobile Layout - Enhanced */}
        <div className="flex md:hidden h-16 items-center">
          {/* Left - Hamburger Menu */}
          <div className="flex items-center justify-start flex-1">
            <Sheet open={isLeftSheetOpen} onOpenChange={setIsLeftSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-xl active:scale-95 transition-transform duration-75"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[95vw] p-0 flex flex-col bg-background/95 backdrop-blur-xl">
                <SheetHeader className="p-6 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {!logoError ? (
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                          <Image
                            src="/logo.png"
                            alt="OddSmash Logo"
                            width={32}
                            height={32}
                            className="object-contain"
                            priority
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">OS</span>
                        </div>
                      )}
                      <SheetTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                        {user ? "Navigation" : "Menu"}
                      </SheetTitle>
                    </div>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl active:scale-95 transition-transform duration-75"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </SheetClose>
                  </div>
                </SheetHeader>
                <div className="flex-1 overflow-auto">
                  <nav className="p-4 space-y-3">
                    {navigationItems.map((item, index) => (
                      <div key={item.title}>
                        {item.children ? (
                          <div className="space-y-2">
                            <button
                              onClick={() => setActiveSection(activeSection === item.title ? null : item.title)}
                              className={cn(
                                "w-full flex items-center justify-between p-4 rounded-2xl text-left font-medium transition-all duration-200 border-2 active:scale-[0.98]",
                                item.isActive
                                  ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                  : "hover:bg-muted/50 border-transparent active:bg-muted/80 hover:border-border/50",
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={cn(
                                    "p-2 rounded-xl transition-colors",
                                    item.isActive ? "bg-blue-100 dark:bg-blue-900/50" : "bg-muted/50",
                                  )}
                                >
                                  {item.icon}
                                </div>
                                <div className="text-left">
                                  <div className="font-semibold text-base">{item.title}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                                </div>
                              </div>
                              <ChevronDown
                                className={cn(
                                  "h-5 w-5 transition-transform duration-200 text-muted-foreground",
                                  activeSection === item.title ? "rotate-180" : "",
                                )}
                              />
                            </button>
                            <AnimatePresence>
                              {activeSection === item.title && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pl-4 space-y-2 pt-2">
                                    {item.children.map((child) => (
                                      <div key={child.title}>
                                        <SheetClose asChild>
                                          <Link
                                            href={child.href}
                                            className={cn(
                                              "flex items-center gap-3 p-3 rounded-xl text-sm transition-all duration-150 active:scale-[0.98] border",
                                              pathname === child.href
                                                ? "bg-primary/5 text-primary font-medium border-primary/20"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/80 border-transparent hover:border-border/30",
                                            )}
                                          >
                                            <div className="p-1.5 rounded-lg bg-muted/50">{child.icon}</div>
                                            <div>
                                              <div className="font-medium">{child.title}</div>
                                              <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                {child.description}
                                              </div>
                                            </div>
                                          </Link>
                                        </SheetClose>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <SheetClose asChild>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center justify-between p-4 rounded-2xl text-base font-medium transition-all duration-200 border-2 active:scale-[0.98]",
                                item.isActive
                                  ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                  : "hover:bg-muted/50 border-transparent active:bg-muted/80 hover:border-border/50",
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={cn(
                                    "p-2 rounded-xl transition-colors",
                                    item.isActive ? "bg-blue-100 dark:bg-blue-900/50" : "bg-muted/50",
                                  )}
                                >
                                  {item.icon}
                                </div>
                                <div className="text-left">
                                  <div className="font-semibold">{item.title}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </Link>
                          </SheetClose>
                        )}
                      </div>
                    ))}
                  </nav>
                </div>
                {/* Enhanced Footer */}
                <div className="border-t border-border/50 p-6 bg-muted/20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Theme</span>
                    </div>
                    <ThemeToggle />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>ODDSMASH © {new Date().getFullYear()}</span>
                    <div className="flex items-center gap-1">
                      <HelpCircle className="h-3 w-3" />
                      <span>Help</span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Center - Logo */}
          <div className="flex items-center justify-center flex-1">
            <Link
              href="/"
              className="flex items-center active:scale-95 transition-transform duration-75 p-2 rounded-xl"
            >
              {!logoError ? (
                <div className="relative w-8 h-8">
                  <Image
                    src="/logo.png"
                    alt="OddSmash Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                    priority
                    onError={() => {
                      console.error("Logo failed to load from /logo.png")
                      setLogoError(true)
                    }}
                  />
                </div>
              ) : (
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  OS
                </span>
              )}
            </Link>
          </div>

          {/* Right - Profile and Cart */}
          <div className="flex items-center justify-end space-x-1 flex-1">
            {/* Profile Menu */}
            <Sheet open={isRightSheetOpen} onOpenChange={setIsRightSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-xl active:scale-95 transition-transform duration-75"
                >
                  <User className="h-6 w-6" />
                  <span className="sr-only">Open profile menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[95vw] p-0 flex flex-col bg-background/95 backdrop-blur-xl">
                <SheetHeader className="p-6 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-xl font-bold">Account</SheetTitle>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl active:scale-95 transition-transform duration-75"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </SheetClose>
                  </div>
                </SheetHeader>
                <div className="flex-1 overflow-auto">
                  {/* User Profile Section */}
                  {user ? (
                    <div className="p-6">
                      <div className="flex items-center space-x-4 p-6 rounded-2xl bg-gradient-to-r from-muted/40 to-muted/20 border border-muted/50">
                        <Avatar className="h-16 w-16 ring-2 ring-primary/20 shadow-lg">
                          <AvatarImage
                            src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                            alt={profile?.email || user?.email || ""}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-2">
                          <h3 className="text-lg font-bold truncate leading-tight">{getDisplayName()}</h3>
                          <p className="text-sm text-muted-foreground truncate font-medium">
                            {profile?.email || user?.email}
                          </p>
                          <Badge variant="secondary" className="text-xs font-semibold">
                            <Star className="w-3 h-3 mr-1" />
                            {preferences?.subscription_tier || "Free Plan"}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-6 space-y-3">
                        <div>
                          <SheetClose asChild>
                            <Link
                              href="/profile"
                              className="flex items-center justify-between p-4 rounded-2xl text-base font-medium transition-all duration-200 hover:bg-muted/50 border-2 border-transparent hover:border-border/50 active:scale-[0.98] active:bg-muted/80"
                            >
                              <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="text-left">
                                  <div className="font-semibold">Profile Settings</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">Manage your account</div>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </Link>
                          </SheetClose>
                        </div>
                        <div>
                          <SheetClose asChild>
                            <Link
                              href="/history"
                              className="flex items-center justify-between p-4 rounded-2xl text-base font-medium transition-all duration-200 hover:bg-muted/50 border-2 border-transparent hover:border-border/50 active:scale-[0.98] active:bg-muted/80"
                            >
                              <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/50">
                                  <Receipt className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="text-left">
                                  <div className="font-semibold">Slip History</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">View your betslips</div>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </Link>
                          </SheetClose>
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              signOut()
                              setIsRightSheetOpen(false)
                            }}
                            className="flex items-center justify-between w-full p-4 rounded-2xl text-base font-medium transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 border-2 border-transparent hover:border-red-200 dark:hover:border-red-800 active:scale-[0.98] active:bg-red-100 dark:active:bg-red-950/30"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/50">
                                <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
                              </div>
                              <div className="text-left">
                                <div className="font-semibold">Sign Out</div>
                                <div className="text-xs text-red-500/70 mt-0.5">End your session</div>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="space-y-4">
                        <div>
                          <SheetClose asChild>
                            <Button
                              asChild
                              size="lg"
                              className="w-full h-12 text-base font-semibold rounded-2xl active:scale-[0.98] transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
                            >
                              <Link href="/sign-up" className="flex items-center justify-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Start Smashing
                              </Link>
                            </Button>
                          </SheetClose>
                        </div>
                        <div>
                          <SheetClose asChild>
                            <Button
                              asChild
                              variant="ghost"
                              size="lg"
                              className="w-full h-12 text-base font-medium rounded-2xl active:scale-[0.98] transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            >
                              <Link href="/sign-in">Already have an account? Sign In</Link>
                            </Button>
                          </SheetClose>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Enhanced Footer */}
                <div className="border-t border-border/50 p-6 bg-muted/20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Theme</span>
                    </div>
                    <ThemeToggle />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>ODDSMASH © {new Date().getFullYear()}</span>
                    <div className="flex items-center gap-1">
                      <HelpCircle className="h-3 w-3" />
                      <span>Help</span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Mobile Cart - Only show for authenticated users */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/betslip")}
                className="relative h-11 w-11 rounded-xl active:scale-95 transition-transform duration-75"
              >
                <Receipt className="h-6 w-6" />
                {totalSelections > 0 &&
                  (isMobile ? (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                      {totalSelections}
                    </span>
                  ) : (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg"
                    >
                      {totalSelections}
                    </motion.span>
                  ))}
              </Button>
            )}
          </div>
        </div>
      </div>
    </HeaderComponent>
  )
}
