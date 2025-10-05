import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "OddSmash - Sports Betting Tools",
  description: "Access free sports betting tools and analytics",
};

export default function PublicLayout({
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