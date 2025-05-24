'use client';

import type { ReactNode } from "react";
import { usePathname } from 'next/navigation';
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/react";
import { Footer } from "@/components/landing-page/footer";
import { Header } from "@/components/Header";
import { SportsbookProvider } from "@/contexts/sportsbook-context";
import { Toaster } from "@/components/ui/toaster";

export function LayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isJoinUsPage = pathname === '/join-us';

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <SportsbookProvider>
        {!isJoinUsPage && <Header />}

        {/* Apply full width on mobile, container with padding on larger screens */}
        <main className="w-full mx-auto max-w-screen-2xl">{children}</main>

        <Toaster />
        
        <Analytics />
      </SportsbookProvider>
      {!isJoinUsPage && <footer><Footer /></footer>}
    </ThemeProvider>
  );
} 