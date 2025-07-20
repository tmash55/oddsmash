"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface LayoutContentProps {
  children: React.ReactNode;
}

export function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();
  
  // Check if current route is an auth route
  const isAuthRoute = pathname?.startsWith('/sign-in') || 
                     pathname?.startsWith('/sign-up') || 
                     pathname?.startsWith('/forgot-password') || 
                     pathname?.startsWith('/reset-password') ||
                     pathname?.startsWith('/onboarding');

  return (
    <div className="relative min-h-screen flex flex-col">
      {!isAuthRoute && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {!isAuthRoute && <Footer />}
    </div>
  );
}
