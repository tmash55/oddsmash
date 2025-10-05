import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "OddSmash - Dashboard",
  description: "Your sports betting dashboard",
};

export default function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      
      {children}
    </div>
  );
} 