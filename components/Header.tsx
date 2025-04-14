"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

import { useSportsbooks } from "@/contexts/sportsbook-context";
import { ThemeToggle } from "./theme-toggle";
import { SportLogo } from "./sport-logo";
import { sports } from "@/data/sports-data";
import { StateSelector } from "./state-selector";
import { useMediaQuery } from "@/hooks/use-media-query";

export function Header() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<string | null>(null);
  const pathname = usePathname();
  const { openSportsbookSelector } = useSportsbooks();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Filter active sports
  const activeSports = sports.filter((sport) => sport.active);

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
      href: "//mlb/props",
      icon: <BarChart3 className="h-5 w-5 text-primary" />,
      isActive: pathname?.startsWith("/props"),
      children: playerPropsItems,
    },
    {
      title: "Parlay Builder",
      href: "/parlay-builder",
      icon: <LineChart className="h-5 w-5 text-primary" />,
      isActive: pathname?.startsWith("/parlay-builder"),
    },
    {
      title: "Promo Calendar",
      href: "/promo-calendar",
      icon: <Calendar className="h-5 w-5 text-primary" />,
      isActive: pathname?.startsWith("/promo-calendar"),
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
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-70 animate-pulse-slow"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-70 animate-pulse-medium"></div>
      </div>

      <div className="container grid grid-cols-3 h-16 items-center relative z-10">
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
        <div className="hidden md:flex justify-center">
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
                          href="//mlb/props"
                        >
                          <div className="mt-4 mb-2 text-lg font-medium text-white">
                            Player Props
                          </div>
                          <p className="text-sm leading-tight text-white/90">
                            Compare odds across sportsbooks and find the best
                            value for any player prop bet
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
                <Link href="/parlay-builder" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "px-3 transition-all duration-300 group",
                      pathname?.startsWith("/parlay-builder") && "bg-muted"
                    )}
                  >
                    Parlay Builder
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/promo-calendar" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "px-3 transition-all duration-300 group",
                      pathname?.startsWith("/promo-calendar") && "bg-muted"
                    )}
                  >
                    Promo Calendar
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right column - Theme toggle, State selector, and Sportsbooks button */}
        <div className="hidden md:flex justify-end items-center space-x-2">
          <StateSelector />
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            className="border-primary/20 bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20"
            onClick={openSportsbookSelector}
          >
            <Zap className="mr-1.5 h-3.5 w-3.5 text-primary" />
            Sportsbooks
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden col-span-2 justify-end items-center space-x-2">
          <StateSelector />
          <ThemeToggle />

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-1">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[350px] p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  ODDSMASH
                </SheetTitle>
              </SheetHeader>

              <div className="py-4 px-2">
                <nav className="space-y-1">
                  {navigationItems.map((item) => (
                    <React.Fragment key={item.title}>
                      {item.children ? (
                        <div className="space-y-1">
                          <button
                            onClick={() =>
                              setActiveSection(
                                activeSection === item.title ? null : item.title
                              )
                            }
                            className={cn(
                              "w-full flex items-center justify-between px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                              item.isActive
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted"
                            )}
                          >
                            <div className="flex items-center">
                              {item.icon}
                              <span className="ml-3">{item.title}</span>
                            </div>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform duration-200",
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
                                <div className="pl-10 pr-4 py-1 space-y-1">
                                  {item.children.map((child) => (
                                    <SheetClose asChild key={child.title}>
                                      <Link
                                        href={child.href}
                                        className={cn(
                                          "flex items-center px-2 py-2 rounded-md text-sm transition-colors",
                                          pathname === child.href
                                            ? "bg-primary/5 text-primary font-medium"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                      >
                                        {child.icon}
                                        <span className="ml-2">
                                          {child.title}
                                        </span>
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
                              "flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                              item.isActive
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted"
                            )}
                          >
                            {item.icon}
                            <span className="ml-3">{item.title}</span>
                            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                          </Link>
                        </SheetClose>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              </div>

              <div className="mt-auto border-t p-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    openSportsbookSelector();
                    setIsSheetOpen(false);
                  }}
                >
                  <Zap className="mr-2 h-4 w-4 text-primary" />
                  Sportsbooks
                </Button>
              </div>
            </SheetContent>
          </Sheet>
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
