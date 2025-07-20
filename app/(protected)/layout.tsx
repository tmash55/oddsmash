import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "OddSmash - Dashboard",
  description: "Your sports betting dashboard",
};

async function getUser() {
  const supabase = createClient();
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
} 