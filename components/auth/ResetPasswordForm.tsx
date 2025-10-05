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
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully reset.",
      });
      
      router.push("/sign-in");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error resetting password",
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
          <CardTitle className="text-2xl text-white">Reset Password</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-gray-200">New Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your new password"
                    required 
                    disabled={isLoading}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-blue-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-white" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-white" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="text-gray-200">Confirm New Password</Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    required 
                    disabled={isLoading}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-blue-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-white" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-white" />
                    )}
                    <span className="sr-only">
                      {showConfirmPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-500/90 to-emerald-600/90 hover:from-green-600/90 hover:to-emerald-700/90 text-white" 
                disabled={isLoading}
              >
                {isLoading ? "Resetting password..." : "Reset Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 