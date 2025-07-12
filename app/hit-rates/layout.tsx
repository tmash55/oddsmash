import { Metadata } from "next"
import { ReactNode } from "react";
import config from "@/config";

export const metadata: Metadata = {
  title: "Hit Rates | OddSmash",
  description: "View player hit rates for sports betting props",
}

export default async function HitRatesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}