"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HelpCircle, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
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
import { useAuth } from "@/components/auth/auth-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

// Define sports and their features
const sports = [
  {
    id: "mlb",
    name: "MLB",
    features: [
      { id: "hit-rates", name: "Hit Rates" },
      { id: "hit-sheets", name: "Hit Sheets" },
      { id: "box-scores", name: "Box Scores" },
      { id: "parlay", name: "Parlay Builder" },
    ],
  },
  {
    id: "nba",
    name: "NBA",
    features: [
      { id: "hit-rates", name: "Hit Rates" },
      { id: "box-scores", name: "Box Scores" },
      { id: "parlay", name: "Parlay Builder" },
    ],
  },
  {
    id: "nfl",
    name: "NFL",
    features: [
      { id: "hit-rates", name: "Hit Rates" },
      { id: "box-scores", name: "Box Scores" },
      { id: "parlay", name: "Parlay Builder" },
    ],
  },
  {
    id: "nhl",
    name: "NHL",
    features: [
      { id: "hit-rates", name: "Hit Rates" },
      { id: "box-scores", name: "Box Scores" },
      { id: "parlay", name: "Parlay Builder" },
    ],
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-background/80 border-b backdrop-blur supports-[backdrop-filter]:bg-background/60"
          : "bg-background/95 supports-[backdrop-filter]:bg-background/80"
      )}
    >
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center">
            <motion.span 
              className="font-semibold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              OddSmash
            </motion.span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:flex-1 md:justify-center">
          <NavigationMenu>
            <NavigationMenuList>
              <AnimatePresence>
                {sports.map((sport) => (
                  <NavigationMenuItem key={sport.id}>
                    <NavigationMenuTrigger
                      className={cn(
                        "h-9 px-4 gap-2 data-[state=open]:bg-accent",
                        pathname?.startsWith(`/dashboard/${sport.id}`) && "text-primary"
                      )}
                    >
                      <span>{sport.name}</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="w-[200px] p-2"
                      >
                        <Link
                          href={`/dashboard/${sport.id}`}
                          className="block rounded-md bg-gradient-to-b from-primary/50 to-primary/10 p-4 no-underline transition-colors hover:bg-accent"
                        >
                          <div className="text-sm font-medium mb-1">{sport.name} Dashboard</div>
                          <p className="text-xs text-muted-foreground">Overview and quick access</p>
                        </Link>
                        <div className="mt-2">
                          {sport.features.map((feature) => (
                            <Link
                              key={feature.id}
                              href={`/dashboard/${sport.id}/${feature.id}`}
                              className={cn(
                                "block rounded-md px-4 py-2 text-sm transition-colors hover:bg-accent",
                                pathname === `/dashboard/${sport.id}/${feature.id}` && "bg-accent"
                              )}
                            >
                              {feature.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
              </AnimatePresence>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <SheetHeader className="border-b p-4">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col py-2">
                {sports.map((sport) => (
                  <div key={sport.id} className="px-2">
                    <div className="px-4 py-2 text-sm font-medium text-muted-foreground">
                      {sport.name}
                    </div>
                    <div className="space-y-1">
                      <Link
                        href={`/dashboard/${sport.id}`}
                        className={cn(
                          "block rounded-md px-4 py-2 text-sm transition-colors hover:bg-accent",
                          pathname === `/dashboard/${sport.id}` && "bg-accent"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      {sport.features.map((feature) => (
                        <Link
                          key={feature.id}
                          href={`/dashboard/${sport.id}/${feature.id}`}
                          className={cn(
                            "block rounded-md px-4 py-2 text-sm transition-colors hover:bg-accent",
                            pathname === `/dashboard/${sport.id}/${feature.id}` && "bg-accent"
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {feature.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            asChild
          >
            <Link href="/about">
              <HelpCircle className="h-4 w-4" />
              <span className="sr-only">About</span>
            </Link>
          </Button>

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
    </nav>
  )
} 