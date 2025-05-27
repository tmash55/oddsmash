import { Metadata } from "next"
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
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
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(config.auth.loginUrl);
  }

  return <>{children}</>;
}