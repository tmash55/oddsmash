import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { Viewport } from "next";
import { getSEOTags } from "@/libs/seo";

import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { Metadata } from "next"
import { redirect } from "next/navigation";
import config from "@/config";

import { createClient } from "@/libs/supabase/server";
import { DashboardNav } from "@/components/dashboard/nav"
import { Toaster } from "@/components/ui/sonner"

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Dashboard | OddSmash",
  description: "OddSmash sports betting dashboard",
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container py-6">{children}</main>
        <Toaster />
      </div>
    </AuthProvider>
  )
}