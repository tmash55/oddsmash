import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { SportLogo } from "@/components/sport-logo"

// Define sports and their features
const sports = [
  {
    id: "mlb",
    name: "MLB",
    features: [
      {
        id: "hit-rates",
        name: "Hit Rates",
        description: "Track player prop hit rates and trends",
      },
      {
        id: "hit-sheets",
        name: "Hit Sheets",
        description: "Player prop sheets and analysis",
      },
      {
        id: "box-scores",
        name: "Box Scores",
        description: "Live game stats and box scores",
      },
      {
        id: "parlay",
        name: "Parlay Builder",
        description: "Build and track your parlays",
      },
    ],
  },
  {
    id: "nba",
    name: "NBA",
    features: [
      {
        id: "hit-rates",
        name: "Hit Rates",
        description: "Track player prop hit rates and trends",
      },
      {
        id: "box-scores",
        name: "Box Scores",
        description: "Live game stats and box scores",
      },
      {
        id: "parlay",
        name: "Parlay Builder",
        description: "Build and track your parlays",
      },
    ],
  },
  {
    id: "nfl",
    name: "NFL",
    features: [
      {
        id: "hit-rates",
        name: "Hit Rates",
        description: "Track player prop hit rates and trends",
      },
      {
        id: "box-scores",
        name: "Box Scores",
        description: "Live game stats and box scores",
      },
      {
        id: "parlay",
        name: "Parlay Builder",
        description: "Build and track your parlays",
      },
    ],
  },
  {
    id: "nhl",
    name: "NHL",
    features: [
      {
        id: "hit-rates",
        name: "Hit Rates",
        description: "Track player prop hit rates and trends",
      },
      {
        id: "box-scores",
        name: "Box Scores",
        description: "Live game stats and box scores",
      },
      {
        id: "parlay",
        name: "Parlay Builder",
        description: "Build and track your parlays",
      },
    ],
  },
]

export function DashboardHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  // Handle scroll effect
  useEffect(() => {
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

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full backdrop-blur transition-all duration-300",
        isScrolled
          ? "bg-background/80 supports-[backdrop-filter]:bg-background/60 border-b"
          : "bg-background/95 supports-[backdrop-filter]:bg-background/80"
      )}
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/98 to-background/95 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-70 animate-pulse-slow"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-70 animate-pulse-medium"></div>
      </div>

      <div className="container flex h-16 items-center justify-between relative z-10">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center space-x-2 group">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent relative">
              SmashBoard
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </span>
          </Link>
        </div>

        {/* Main Navigation */}
        <NavigationMenu>
          <NavigationMenuList>
            {sports.map((sport) => (
              <NavigationMenuItem key={sport.id}>
                <NavigationMenuTrigger
                  className={cn(
                    "px-3 transition-all duration-300 group",
                    pathname?.startsWith(`/dashboard/${sport.id}`) && "bg-muted"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <SportLogo sport={sport.id} size="xs" />
                    <span>{sport.name}</span>
                  </div>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4">
                    <li className="row-span-3 rounded-md bg-gradient-to-b from-primary to-primary/80 shadow-lg overflow-hidden group relative">
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md p-6 no-underline outline-none focus:shadow-md"
                          href={`/dashboard/${sport.id}/home`}
                        >
                          <div className="mt-4 mb-2 text-lg font-medium text-white">
                            {sport.name} Dashboard
                          </div>
                          <p className="text-sm leading-tight text-white/90">
                            Overview and quick access to all {sport.name} features
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    {sport.features.map((feature) => (
                      <ListItem
                        key={feature.id}
                        title={feature.name}
                        href={`/dashboard/${sport.id}/${feature.id}`}
                      >
                        {feature.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right Side - User Menu */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || ""} />
                  <AvatarFallback className="bg-primary/10">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.user_metadata?.full_name || "User"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
                onClick={() => signOut()}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
}) 