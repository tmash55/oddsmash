"use client";

import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Providers from "./providers"
import { LayoutContent } from "@/components/layout-content"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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
