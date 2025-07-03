'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { BetslipProvider } from "@/contexts/betslip-context"
import { BetslipOverlay } from "@/components/betslip/betslip-overlay"
import { SportsbookProvider } from "@/contexts/sportsbook-context"
import { AuthProvider } from "@/components/auth/auth-provider"

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60, // 1 hour
      },
    },
  }))

  // Check if current route is an auth route
  const isAuthRoute = pathname?.startsWith('/sign-in') || 
                     pathname?.startsWith('/sign-up') || 
                     pathname?.startsWith('/forgot-password') || 
                     pathname?.startsWith('/reset-password') ||
                     pathname?.startsWith('/onboarding')

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SportsbookProvider>
          {isAuthRoute ? (
            // Auth routes: No betslip provider or components
            children
          ) : (
            // Regular routes: Include betslip functionality
            <BetslipProvider>
              {children}
              <BetslipOverlay />
            </BetslipProvider>
          )}
        </SportsbookProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
} 