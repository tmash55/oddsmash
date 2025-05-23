import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { Viewport } from "next";
import { getSEOTags } from "@/libs/seo";
import { LayoutContent } from "./components/layout-content";

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
      <body className={font.className}>
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}
