"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Menu,
  X,
  BarChart3,
  LineChart,
  Calendar,
  Settings,
} from "lucide-react";

import { useSportsbooks } from "@/contexts/sportsbook-context";
import { ThemeToggle } from "./theme-toggle";
import { SportIcon } from "./sport-icon";

export function Header() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const { openSportsbookSelector } = useSportsbooks();

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

  // Player Props dropdown items
  const playerPropsItems = [
    {
      title: "NBA Basketball",
      description: "Points, rebounds, assists and more",
      href: "/nba/player-props",
      icon: <SportIcon sport="nba" size="xs" />,
    },
    {
      title: "NFL Football",
      description: "Passing, rushing, receiving yards",
      href: "/nfl/player-props",
      icon: <SportIcon sport="nfl" size="xs" />,
    },
    {
      title: "MLB Baseball",
      description: "Home runs, hits, strikeouts",
      href: "/mlb/player-props",
      icon: <SportIcon sport="mlb" size="xs" />,
    },
    {
      title: "NHL Hockey",
      description: "Goals, assists, saves",
      href: "/nhl/player-props",
      icon: <SportIcon sport="nhl" size="xs" />,
    },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur transition-all duration-300",
        isScrolled
          ? "bg-background/80 supports-[backdrop-filter]:bg-background/60"
          : "bg-background/95 supports-[backdrop-filter]:bg-background/80"
      )}
    >
      {/* Gradient background with subtle animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/98 to-background/95 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-70 animate-pulse"></div>
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
            <NavigationMenuList className="flex space-x-2">
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "px-3 transition-all duration-300",
                    pathname?.startsWith("/player-props") && "bg-muted"
                  )}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Player Props
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <li className="row-span-5 rounded-md bg-gradient-to-b from-primary to-primary/80 shadow-lg">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md p-6 no-underline outline-none focus:shadow-md"
                          href="/player-props"
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
                      "px-3 transition-all duration-300",
                      pathname?.startsWith("/parlay-builder") && "bg-muted"
                    )}
                  >
                    <LineChart className="mr-2 h-4 w-4" />
                    Parlay Builder
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/promo-calendar" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "px-3 transition-all duration-300",
                      pathname?.startsWith("/promo-calendar") && "bg-muted"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Promo Calendar
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right column - Theme toggle and Sportsbooks button */}
        <div className="hidden md:flex justify-end items-center space-x-2">
          <ThemeToggle />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex justify-end md:hidden col-span-2 space-x-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="ml-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur-sm">
          <div className="container py-4">
            <nav className="flex flex-col space-y-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start px-3 py-2 h-auto font-medium text-base border border-primary/20 bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20",
                      pathname?.startsWith("/player-props") &&
                        "bg-primary/20 dark:bg-primary/30"
                    )}
                  >
                    <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                    Player Props
                    <ChevronDown className="ml-auto h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {playerPropsItems.map((item) => (
                    <DropdownMenuItem key={item.title} asChild>
                      <Link
                        href={item.href}
                        className="flex items-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.icon}
                        <div className="ml-2">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link
                href="/parlay-builder"
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-base font-medium border",
                  pathname?.startsWith("/parlay-builder")
                    ? "bg-primary/20 text-foreground border-primary/30 dark:bg-primary/30"
                    : "text-foreground border-primary/20 bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LineChart className="mr-2 h-5 w-5 text-primary" />
                Parlay Builder
              </Link>

              <Link
                href="/promo-calendar"
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-base font-medium border",
                  pathname?.startsWith("/promo-calendar")
                    ? "bg-primary/20 text-foreground border-primary/30 dark:bg-primary/30"
                    : "text-foreground border-primary/20 bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                Promo Calendar
              </Link>
            </nav>
          </div>
        </div>
      )}
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
