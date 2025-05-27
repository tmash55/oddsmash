import { Metadata } from "next"
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import config from "@/config";

export const metadata: Metadata = {
  title: "Quick Hits | OddSmash",
  description: "Fast access to popular hit rate functions and data sets",
}

export default async function QuickHitsLayout({
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