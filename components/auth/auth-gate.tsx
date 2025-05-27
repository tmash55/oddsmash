"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ScrollingBackground from "@/app/join-us/components/scrolling-background";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "./auth-provider";
import { useToast } from "@/components/ui/use-toast";

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return children;
  }

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to complete your registration.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0A0A0A]">
      {/* Logo in top left corner */}
      <Link href="/" className="absolute top-4 left-4 z-30 flex items-center justify-center w-10 h-10">
        <Image
          src="/icon.png"
          alt="OddSmash Logo"
          width={40}
          height={40}
          className="hover:opacity-80 transition-opacity"
          priority
        />
      </Link>

      {/* X (Twitter) link in top right corner */}
      <Link 
        href="https://x.com/OddSmashApp" 
        target="_blank"
        rel="noopener noreferrer" 
        className="absolute top-4 right-4 z-30 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
      >
        <span className="text-sm hidden sm:inline">Follow for updates</span>
        <div className="w-10 h-10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      </Link>

      <ScrollingBackground />

      {/* Gradient Blur Overlay */}
      <div className="absolute inset-0 z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-purple-500/8 to-transparent backdrop-blur-[1.5px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* Auth Card */}
      <div className="relative z-20 min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                {isLogin ? "Welcome Back" : "Join OddSmash"}
              </CardTitle>
              <CardDescription className="text-center text-white/60">
                {isLogin 
                  ? "Sign in to access exclusive features" 
                  : "Create a free account to unlock early access features"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <Button 
                className="w-full bg-primary hover:bg-primary/90" 
                onClick={handleAuth}
              >
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 text-sm text-center">
              <p className="text-white/60">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
              {isLogin && (
                <button className="text-white/60 hover:text-white/80">
                  Forgot your password?
                </button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 