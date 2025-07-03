"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Menu,
  BarChart3,
  LineChart,
  Calendar,
  Zap,
  ChevronRight,
  Home,
  Activity,
  Crown,
  User,
  LogOut,
  Sparkles,
  X,
  Receipt,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { useAuth } from "@/components/auth/auth-provider";
import { useBetslip } from "@/contexts/betslip-context";
import { ThemeToggle } from "./theme-toggle";
import { SportLogo } from "./sport-logo";
import { sports } from "@/data/sports-data";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useEffect, useState } from "react";
import { createClient } from "@/libs/supabase/client";

// Profile interface matching the database schema
interface Profile {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  avatar_url?: string;
  phone?: string;
  state?: string;
  created_at: string;
  updated_at: string;
}

interface UserPreferences {
  subscription_tier?: string;
  theme?: string;
  notifications_enabled?: boolean;
  public_profile?: boolean;
}

export function Header() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isLeftSheetOpen, setIsLeftSheetOpen] = React.useState(false);
  const [isRightSheetOpen, setIsRightSheetOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<string | null>(null);
  const [logoError, setLogoError] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { betslips } = useBetslip();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  // Filter active sports
  const activeSports = sports.filter((sport) => sport.active);

  // Calculate total selections across all betslips
  const totalSelections = betslips.reduce((total, betslip) => total + betslip.selections.length, 0);

  // Handle scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load user profile data
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setPreferences({});
      setLoading(false);
      return;
    }

    async function loadProfileData() {
      try {
        // Load profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error loading profile:', profileError);
        }

        // Load preferences  
        const { data: preferencesData, error: preferencesError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('id', user.id)
          .single();

        if (preferencesError && preferencesError.code !== 'PGRST116') {
          console.error('Error loading preferences:', preferencesError);
        }

        setProfile(profileData || { 
          id: user.id, 
          email: user.email || '', 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setPreferences(preferencesData || {});
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [user, supabase]);

  // Get user initials matching profile page logic
  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile?.name) {
      const names = profile.name.split(' ');
      return names.length > 1 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : names[0][0].toUpperCase();
    }
    return profile?.email?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
  };

  // Get display name matching profile page logic
  const getDisplayName = () => {
    if (profile?.name) return profile.name;
    if (profile?.first_name && profile?.last_name) return `${profile.first_name} ${profile.last_name}`;
    if (profile?.first_name) return profile.first_name;
    if (profile?.email) return profile.email.split('@')[0];
    if (user?.email) return user.email.split('@')[0];
    return "User";
  };

  // Generate player props items from active sports
  const playerPropsItems = activeSports.map((sport) => {
    // Create description based on sport type
    let description = "";
    if (sport.id.includes("basketball")) {
      description = "Points, rebounds, assists and more";
    } else if (sport.id.includes("football") || sport.id.includes("nfl")) {
      description = "Passing, rushing, receiving yards";
    } else if (sport.id.includes("baseball")) {
      description = "Home runs, hits, strikeouts";
    } else if (sport.id.includes("hockey")) {
      description = "Goals, assists, saves";
    } else {
      description = "Player statistics and props";
    }

    // Create URL path from sport ID
    const sportPath = sport.id.split("_").pop() || sport.id;

    return {
      title: sport.name,
      description,
      href: `/${sportPath.toLowerCase()}/props/`,
      icon: <SportLogo sport={sport.id} size="xs" />,
    };
  });

  // Hit rates items
  const hitRatesItems = [
    {
      title: "Hit Rates",
      description: "Track player prop hit rates and trends",
      href: "/hit-rates",
      icon: <BarChart3 className="h-4 w-4 text-primary" />,
    },
    {
      title: "Hit Sheets",
      description: "Instant access to the most popular hit-rate sheets—player streaks, strikeout rates, and More",
      href: "/hit-sheets",
      icon: <Zap className="h-4 w-4 text-primary" />,
    },
    {
      title: "Data Duels",
      description: "Game-by-game matchup analysis with player hit rates and odds",
      href: "/mlb/data-duels",
      icon: <Activity className="h-4 w-4 text-primary" />,
    },
  ];

  // Tracker items
  const trackerItems = [
    {
      title: "KOTP Leaderboard",
      description: "Track the King of the Playoffs",
      href: "/trackers/kotp-leaderboard",
      icon: <Crown className="h-4 w-4 text-primary" />,
    },
    {
      title: "KOTD Leaderboard",
      description: "Track MLB home runs for King of the Diamond",
      href: "/trackers/kotd-leaderboard",
      icon: <Crown className="h-4 w-4 text-primary" />,
    },
    {
      title: "PRA Leaderboard",
      description: "Track PRA stats for NBA games",
      href: "/trackers/pra-leaderboard",
      icon: <Activity className="h-4 w-4 text-primary" />,
    }
  ];

  // Navigation items for mobile menu
  const navigationItems = [
    {
      title: "Home",
      href: "/",
      icon: <Home className="h-5 w-5 text-primary" />,
      isActive: pathname === "/",
    },
    {
      title: "Player Props",
      href: "/mlb/props",
      icon: <BarChart3 className="h-5 w-5 text-primary" />,
      isActive: pathname?.startsWith("/props"),
      children: playerPropsItems,
    },
    {
      title: "Hit Rates",
      href: "/hit-rates",
      icon: <Activity className="h-5 w-5 text-primary" />,
      isActive: pathname?.startsWith("/hit-rates") || pathname?.startsWith("/hit-sheets"),
      children: hitRatesItems,
    },
    {
      title: "Parlay Builder",
      href: "/parlay-builder",
      icon: <LineChart className="h-5 w-5 text-primary" />,
      isActive: pathname?.startsWith("/parlay-builder"),
    },
    {
      title: "Betslip Scanner",
      href: "/betslip-scanner",
      icon: <Sparkles className="h-5 w-5 text-primary" />,
      isActive: pathname?.startsWith("/betslip-scanner"),
    },
    {
      title: "Stat Tracker",
      href: "#",
      icon: <Activity className="h-5 w-5 text-primary" />,
      isActive: pathname?.startsWith("/trackers"),
      children: trackerItems,
    },
  ];

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
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-70 animate-pulse-slow transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-70 animate-pulse-medium transform translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="container h-16 items-center relative z-10">
        {/* Desktop Layout */}
        <div className="hidden md:grid grid-cols-3 h-16 items-center">
          {/* Logo - Left column */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent relative">
                ODDSMASH
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </span>
            </Link>
          </div>

          {/* Navigation - Center column */}
          <div className="flex justify-center">
            <NavigationMenu>
              <NavigationMenuList className="flex space-x-1">
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      "px-3 transition-all duration-300 group",
                      pathname?.startsWith("/props") && "bg-muted"
                    )}
                  >
                    Player Props
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      <li className="row-span-5 rounded-md bg-gradient-to-b from-primary to-primary/80 shadow-lg overflow-hidden group relative">
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <NavigationMenuLink asChild>
                          <a
                            className="flex h-full w-full select-none flex-col justify-end rounded-md p-6 no-underline outline-none focus:shadow-md"
                            href="/mlb/props"
                          >
                            <div className="mt-4 mb-2 text-lg font-medium text-white">
                              Player Props
                            </div>
                            <p className="text-sm leading-tight text-white/80">
                              Compare player performance odds across all active sports
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      {playerPropsItems.map((item) => (
                        <ListItem
                          key={item.title}
                          title={item.title}
                          href={item.href}
                          icon={item.icon}
                        >
                          {item.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      "px-3 transition-all duration-300 group",
                      (pathname?.startsWith("/hit-rates") || pathname?.startsWith("/hit-sheets") || pathname?.startsWith("/data-duels")) && "bg-muted"
                    )}
                  >
                    Analytics
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      <li className="row-span-3 rounded-md bg-gradient-to-b from-primary to-primary/80 shadow-lg overflow-hidden group relative">
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <NavigationMenuLink asChild>
                          <a
                            className="flex h-full w-full select-none flex-col justify-end rounded-md p-6 no-underline outline-none focus:shadow-md"
                            href="/hit-rates"
                          >
                            <div className="mt-4 mb-2 text-lg font-medium text-white">
                              Analytics Hub
                            </div>
                            <p className="text-sm leading-tight text-white/80">
                              Advanced player analytics and trend data
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      {hitRatesItems.map((item) => (
                        <ListItem
                          key={item.title}
                          title={item.title}
                          href={item.href}
                          icon={item.icon}
                        >
                          {item.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/parlay-builder" legacyBehavior passHref>
                    <NavigationMenuLink 
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "px-3 transition-all duration-300",
                        pathname?.startsWith("/parlay-builder") && "bg-muted"
                      )}
                    >
                      Parlay Builder
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/betslip-scanner" legacyBehavior passHref>
                    <NavigationMenuLink 
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "px-3 transition-all duration-300",
                        pathname?.startsWith("/betslip-scanner") && "bg-muted"
                      )}
                    >
                      Scanner
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      "px-3 transition-all duration-300 group",
                      pathname?.startsWith("/trackers") && "bg-muted"
                    )}
                  >
                    Trackers
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      <li className="row-span-3 rounded-md bg-gradient-to-b from-primary to-primary/80 shadow-lg overflow-hidden group relative">
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <NavigationMenuLink asChild>
                          <a
                            className="flex h-full w-full select-none flex-col justify-end rounded-md p-6 no-underline outline-none focus:shadow-md"
                            href="/trackers"
                          >
                            <div className="mt-4 mb-2 text-lg font-medium text-white">
                              Stat Trackers
                            </div>
                            <p className="text-sm leading-tight text-white/80">
                              Live leaderboards and competition tracking
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      {trackerItems.map((item) => (
                        <ListItem
                          key={item.title}
                          title={item.title}
                          href={item.href}
                          icon={item.icon}
                        >
                          {item.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right column - Cart and Account */}
          <div className="flex justify-end items-center space-x-2">
            {/* User Account */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} alt={profile?.email || user?.email || ""} />
                      <AvatarFallback className="bg-primary/10">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.email || user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <div className="flex items-center justify-between w-full cursor-pointer">
                      <span className="flex items-center">
                        <span className="mr-2">Theme</span>
                      </span>
                      <ThemeToggle />
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 dark:text-red-400"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <Button variant="default" size="sm" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </div>
            )}

            {/* Betslip Cart */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/betslip')}
              className="relative h-9 w-9 hover:bg-muted"
            >
              <Receipt className="h-5 w-5" />
              {totalSelections > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalSelections}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Layout - Target Style */}
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
              <SheetContent side="left" className="w-[95vw] p-0 flex flex-col">
                <SheetHeader className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                      Menu
                    </SheetTitle>
                    <SheetClose asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-11 w-11 rounded-xl active:scale-95 transition-transform duration-75"
                      >
                        <X className="h-6 w-6" />
                      </Button>
                    </SheetClose>
                  </div>
                </SheetHeader>

                <div className="flex-1 overflow-auto">
                  <nav className="p-4 space-y-2">
                    {navigationItems.map((item) => (
                      <React.Fragment key={item.title}>
                        {item.children ? (
                          <div className="space-y-2">
                            <button
                              onClick={() =>
                                setActiveSection(
                                  activeSection === item.title ? null : item.title
                                )
                              }
                              className={cn(
                                "w-full flex items-center justify-between px-6 py-4 rounded-xl text-left font-medium transition-all duration-150 border active:scale-[0.98]",
                                item.isActive
                                  ? "bg-primary/10 text-primary border-primary/20"
                                  : "hover:bg-muted border-transparent active:bg-muted/80"
                              )}
                            >
                              <div className="flex items-center">
                                {item.icon}
                                <span className="ml-4 text-base">{item.title}</span>
                              </div>
                              <ChevronDown
                                className={cn(
                                  "h-5 w-5 transition-transform duration-200",
                                  activeSection === item.title ? "rotate-180" : ""
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
                                  <div className="pl-4 space-y-1">
                                    {item.children.map((child) => (
                                      <SheetClose asChild key={child.title}>
                                        <Link
                                          href={child.href}
                                          className={cn(
                                            "flex items-center px-6 py-4 rounded-xl text-base transition-all duration-150 active:scale-[0.98]",
                                            pathname === child.href
                                              ? "bg-primary/5 text-primary font-medium"
                                              : "text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80"
                                          )}
                                        >
                                          {child.icon}
                                          <span className="ml-3">{child.title}</span>
                                        </Link>
                                      </SheetClose>
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
                                "flex items-center justify-between px-6 py-4 rounded-xl text-base font-medium transition-all duration-150 border active:scale-[0.98]",
                                item.isActive
                                  ? "bg-primary/10 text-primary border-primary/20"
                                  : "hover:bg-muted border-transparent active:bg-muted/80"
                              )}
                            >
                              <div className="flex items-center">
                                {item.icon}
                                <span className="ml-4">{item.title}</span>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </Link>
                          </SheetClose>
                        )}
                      </React.Fragment>
                    ))}
                  </nav>
                </div>

                {/* Footer */}
                <div className="border-t p-6 bg-muted/20">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-base font-medium">Theme</span>
                    <ThemeToggle />
                  </div>
                  
                  <div className="text-sm text-center text-muted-foreground">
                    ODDSMASH © {new Date().getFullYear()}
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
                    src="/icon.png" 
                    alt="OddSmash Logo" 
                    fill
                    className="object-contain"
                    priority
                    onError={() => {
                      console.error('Logo failed to load from /icon.png');
                      setLogoError(true);
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
              <SheetContent side="right" className="w-[95vw] p-0 flex flex-col">
                <SheetHeader className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-2xl font-bold">Account</SheetTitle>
                    <SheetClose asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-11 w-11 rounded-xl active:scale-95 transition-transform duration-75"
                      >
                        <X className="h-6 w-6" />
                      </Button>
                    </SheetClose>
                  </div>
                </SheetHeader>

                <div className="flex-1 overflow-auto">
                  {/* User Profile Section */}
                  {user ? (
                    <div className="p-6">
                      <div className="flex items-center space-x-4 p-6 rounded-2xl bg-gradient-to-r from-muted/40 to-muted/20 border border-muted/50">
                        <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                          <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} alt={profile?.email || user?.email || ""} />
                          <AvatarFallback className="bg-primary/10 text-xl font-semibold">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="text-xl font-semibold truncate leading-tight">
                            {getDisplayName()}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate font-medium">
                            {profile?.email || user?.email}
                          </p>
                          <div className="flex items-center mt-2">
                            <div className="px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
                              <span className="text-xs font-semibold text-primary">
                                {preferences?.subscription_tier || "Free"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-8 space-y-2">
                        <SheetClose asChild>
                          <Link
                            href="/profile"
                            className="flex items-center justify-between px-6 py-4 rounded-xl text-base font-medium transition-all duration-150 hover:bg-muted border border-transparent hover:border-muted active:scale-[0.98] active:bg-muted/80"
                          >
                            <div className="flex items-center">
                              <User className="h-5 w-5 mr-4 text-primary" />
                              <span>View Profile</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </Link>
                        </SheetClose>
                        
                        <button
                          onClick={() => {
                            signOut();
                            setIsRightSheetOpen(false);
                          }}
                          className="flex items-center justify-between w-full px-6 py-4 rounded-xl text-base font-medium transition-all duration-150 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-red-800 active:scale-[0.98] active:bg-red-100 dark:active:bg-red-950/30"
                        >
                          <div className="flex items-center">
                            <LogOut className="h-5 w-5 mr-4" />
                            <span>Sign Out</span>
                          </div>
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="space-y-4">
                        <SheetClose asChild>
                          <Button asChild size="lg" className="w-full h-12 text-base font-medium rounded-xl active:scale-[0.98] transition-transform duration-75">
                            <Link href="/sign-in">Sign In</Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button asChild variant="outline" size="lg" className="w-full h-12 text-base font-medium rounded-xl active:scale-[0.98] transition-transform duration-75">
                            <Link href="/sign-up">Create Account</Link>
                          </Button>
                        </SheetClose>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t p-6 bg-muted/20">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-base font-medium">Theme</span>
                    <ThemeToggle />
                  </div>
                  
                  <div className="text-sm text-center text-muted-foreground">
                    ODDSMASH © {new Date().getFullYear()}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Mobile Cart */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/betslip')}
              className="relative h-11 w-11 rounded-xl active:scale-95 transition-transform duration-75"
            >
              <Receipt className="h-6 w-6" />
              {totalSelections > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                  {totalSelections}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { icon?: React.ReactNode }
>(({ className, title, children, icon, ...props }, ref) => {
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
          <div className="flex items-center">
            {icon && <span className="mr-2">{icon}</span>}
            <div>
              <div className="text-sm font-medium leading-none">{title}</div>
              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                {children}
              </p>
            </div>
          </div>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
