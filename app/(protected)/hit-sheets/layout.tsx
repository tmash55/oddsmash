import { Metadata } from "next"
import { ReactNode } from "react";
import config from "@/config";

export const metadata: Metadata = {
  title: "Hit Sheets | OddSmash",
  description: "Fast access to popular hit rate functions and data sets",
}

export default async function QuickHitsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}