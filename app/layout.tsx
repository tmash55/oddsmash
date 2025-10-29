"use client";
import React from "react";
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Providers from "./providers"
import { LayoutContent } from "@/components/layout-content"
import Script from "next/script";


const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
    <head>
        <Script
          data-website-id="dfid_690205949903c6f4d82ca553"
          data-domain="oddsmash.io"
          src="https://datafa.st/js/script.js"
          strategy="afterInteractive"
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <LayoutContent>
              {children}
            </LayoutContent>
            <Toaster />
            <Analytics />
            <SpeedInsights />
          </Providers>
          </ThemeProvider>
      </body>
    </html>
  )
}
