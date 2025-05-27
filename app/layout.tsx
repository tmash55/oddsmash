import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { Viewport } from "next";
import { getSEOTags } from "@/libs/seo";
import { LayoutContent } from "./components/layout-content";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

import "./globals.css";

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata = getSEOTags();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6979411075342172" crossOrigin="anonymous"></script>
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", font.className)}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <LayoutContent>{children}</LayoutContent>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
