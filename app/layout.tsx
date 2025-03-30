import { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Viewport } from "next";
import { getSEOTags } from "@/libs/seo";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

import { Footer } from "@/components/landing-page/footer";
import { Header } from "@/components/Header";
import { SportsbookProvider } from "@/contexts/sportsbook-context";

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

            <main>{children}</main>

            <Footer />
          </SportsbookProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
