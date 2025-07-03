// app/auth/components/SignInForm.tsx
'use client';

import React from "react";
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
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function SignInForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { signInWithGoogle } = useAuth();
  const supabase = createClient();

  // Show message from URL params (e.g., from sign-up)
  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      toast({
        title: "Email verification required",
        description: message,
      });
    }
  }, [searchParams, toast]);

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
        // Check if user needs onboarding
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('onboarding_completed')
          .eq('id', data.user.id)
          .single();

        toast({
          title: "Welcome back! 👋",
          description: "You have been signed in successfully.",
        });

        // Redirect based on onboarding status
        if (!preferences?.onboarding_completed) {
          // Store user data for onboarding
          sessionStorage.setItem('pendingUserData', JSON.stringify({
            email: data.user.email,
            firstName: data.user.user_metadata?.first_name || '',
            needsOnboarding: true
          }));
          router.push("/onboarding");
        } else {
          router.push("/hit-rates");
        }
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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      // The auth provider will handle the redirect
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error with Google sign-in",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md mx-auto", className)} {...props}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      >
        <Card className="glassmorphic shadow-2xl backdrop-blur-sm md:rounded-xl rounded-none border-0 md:border min-h-screen md:min-h-0 flex flex-col justify-center relative overflow-hidden group">
          {/* Subtle animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-green-400/10 to-emerald-500/10 rounded-full blur-2xl animate-pulse-slow"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-blue-400/10 to-purple-500/10 rounded-full blur-2xl animate-pulse-medium"></div>
          </div>

          <CardHeader className="text-center px-6 md:px-6 pt-8 md:pt-6 relative z-10">
            {/* Animated logo/icon */}
            <motion.div 
              className="flex justify-center mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-green-500/25 transition-all duration-300 p-2">
                  <Image
                    src="/icon.png"
                    alt="OddSmash Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-green-400/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <CardTitle className="text-2xl text-white dark:text-white text-gray-900 mb-2">Welcome Back</CardTitle>
              <CardDescription className="text-white/70 dark:text-white/70 text-gray-600">
                Sign in to your OddSmash account
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6 px-6 md:px-6 pb-8 md:pb-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200 dark:text-gray-200 text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    className="bg-white/5 dark:bg-white/5 bg-gray-100 border-white/10 dark:border-white/10 border-gray-300 text-white dark:text-white text-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-500 placeholder:text-gray-400 focus-visible:ring-green-500 transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-200 dark:text-gray-200 text-gray-700 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white hover:text-gray-900 underline-offset-4 hover:underline transition-colors duration-300"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required 
                      disabled={isLoading || isGoogleLoading}
                      className="bg-white/5 dark:bg-white/5 bg-gray-100 border-white/10 dark:border-white/10 border-gray-300 text-white dark:text-white text-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-500 placeholder:text-gray-400 focus-visible:ring-green-500 pr-10 transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading || isGoogleLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors duration-300" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors duration-300" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-500/90 to-emerald-600/90 hover:from-green-600/90 hover:to-emerald-700/90 text-white shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-[1.02]" 
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="flex items-center gap-4">
                <Separator className="flex-1 bg-white/10 dark:bg-white/10 bg-gray-300" />
                <span className="text-xs font-normal text-gray-500 dark:text-gray-500 text-gray-400 uppercase">or continue with</span>
                <Separator className="flex-1 bg-white/10 dark:bg-white/10 bg-gray-300" />
              </div>

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                className="w-full mt-4 border-white/10 dark:border-white/10 border-gray-300 text-white dark:text-white text-gray-900 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-100 relative transition-all duration-300 transform hover:scale-[1.02]"
              >
                {isGoogleLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-white border-gray-900"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-center text-sm text-gray-400 dark:text-gray-400 text-gray-600"
            >
              Don't have an account?{" "}
              <Link href="/sign-up" className="text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 underline-offset-4 hover:underline font-medium transition-colors duration-300">
                Sign up for free
              </Link>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
