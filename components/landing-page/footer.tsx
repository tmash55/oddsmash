"use client";

import Link from "next/link";
import { ChevronRight, Mail, Twitter, Instagram, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import config from "@/config";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-background border-t border-border/40">
      <div className="container px-4 py-12 mx-auto">
        {/* Mobile-first footer layout */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          {/* Branding & Newsletter - Full width on mobile, 5 cols on desktop */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="flex items-center space-x-2">
                <span className="font-bold text-2xl">{config.appName}</span>
              </Link>
              <p className="text-muted-foreground text-sm">
                Compare odds across sportsbooks to maximize your potential
                returns. Never leave money on the table again.
              </p>
            </div>

            {/* Newsletter signup */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Subscribe to our newsletter</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="max-w-xs"
                />
                <Button size="sm" className="w-full sm:w-auto">
                  Subscribe
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                We&apos;ll never share your email. Unsubscribe anytime.
              </p>
            </div>
          </div>

          {/* Quick Links - Full width on mobile, 3 cols on desktop */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-base font-semibold">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <Link
                href="/mlb/props"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                MLB Props
              </Link>
              <Link
                href="/nba/props"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                NBA Props
              </Link>
              <Link
                href="/nfl/props"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                NFL Props
              </Link>
              <Link
                href="/parlay-builder"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Parlay Builder
              </Link>
            </nav>
          </div>

          {/* Company Links - Full width on mobile, 2 cols on desktop */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-base font-semibold">Company</h3>
            <nav className="flex flex-col space-y-2">
              <Link
                href="/about"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                About Us
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Legal Links - Full width on mobile, 2 cols on desktop */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-base font-semibold">Legal</h3>
            <nav className="flex flex-col space-y-2">
              <Link
                href="/terms-of-service"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy-policy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="https://www.responsiblegambling.org/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Responsible Gambling
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom section with social links and copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-12 pt-8 border-t border-border/40">
          <div className="flex space-x-6 mb-4 md:mb-0">
            <a
              href="https://x.com/trackkotc"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Twitter className="h-5 w-5" />
            </a>

            <a
              href="mailto:info@betterodds.com"
              aria-label="Email"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>

          <div className="text-sm text-muted-foreground text-center md:text-right">
            <p>© {currentYear} OddSmash. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
