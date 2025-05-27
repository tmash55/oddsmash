// app/auth/components/SignInForm.tsx
'use client';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export default function SignInForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Success!",
          description: "You have been signed in.",
        });
        router.push("/hit-rates");
        router.refresh();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-black/40 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Sign In</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your email below to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-gray-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-gray-200">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm text-gray-400 hover:text-white underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required 
                  disabled={isLoading}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-500/90 to-emerald-600/90 hover:from-green-600/90 hover:to-emerald-700/90 text-white" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm text-gray-400">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="text-white hover:text-gray-300 underline-offset-4 hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
