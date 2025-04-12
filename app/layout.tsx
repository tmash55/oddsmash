import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { Viewport } from "next";
import { getSEOTags } from "@/libs/seo";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/react";
import { Footer } from "@/components/landing-page/footer";
import { Header } from "@/components/Header";
import { SportsbookProvider } from "@/contexts/sportsbook-context";
import { Toaster } from "@/components/ui/toaster";

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata = getSEOTags();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head></head>
      <body className={font.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SportsbookProvider>
            <Header />

            {/* Apply full width on mobile, container with padding on larger screens */}
            <main className="w-full mx-auto max-w-screen-2xl">{children}</main>

            <Toaster />
            <Footer />
            <Analytics />
          </SportsbookProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
