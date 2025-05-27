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
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

export default function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // Check password match whenever either password field changes
  useEffect(() => {
    if (password && confirmPassword) {
      setPasswordsMatch(password === confirmPassword);
    } else {
      setPasswordsMatch(null);
    }
  }, [password, confirmPassword]);

  const checkEmailExists = async (email: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error('Error checking email:', error);
      return false;
    }

    return !!data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Check if email exists in profiles
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        toast({
          variant: "destructive",
          title: "Account already exists",
          description: "An account with this email already exists. Please sign in instead.",
        });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Success!",
          description: "Please check your email to confirm your account.",
        });
        router.push("/sign-in");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error signing up",
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
          <CardTitle className="text-2xl text-white">Create an Account</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your email below to create your account
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
                <Label htmlFor="password" className="text-gray-200">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  required 
                  disabled={isLoading}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confirmPassword" className="text-gray-200">Confirm Password</Label>
                  <AnimatePresence mode="wait">
                    {passwordsMatch !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                          "flex items-center gap-1 text-sm",
                          passwordsMatch ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {passwordsMatch ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Passwords match</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            <span>Passwords don't match</span>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required 
                  disabled={isLoading}
                  className={cn(
                    "bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-blue-500",
                    passwordsMatch === false && "border-red-500/50 focus-visible:ring-red-500",
                    passwordsMatch === true && "border-green-500/50 focus-visible:ring-green-500"
                  )}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-500/90 to-emerald-600/90 hover:from-green-600/90 hover:to-emerald-700/90 text-white" 
                disabled={isLoading || passwordsMatch === false}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-white hover:text-gray-300 underline-offset-4 hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 