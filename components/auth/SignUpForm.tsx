"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/libs/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, Mail, Lock, User, Eye, EyeOff } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth/auth-provider"
import Image from "next/image"
import { getRedirectUrl } from "@/lib/utils/auth"

export default function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { signInWithGoogle } = useAuth()
  const supabase = createClient()

  // Check password match
  useEffect(() => {
    if (password && confirmPassword) {
      setPasswordsMatch(password === confirmPassword)
    } else {
      setPasswordsMatch(null)
    }
  }, [password, confirmPassword])

  // Check password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength("weak")
      return
    }

    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const isLongEnough = password.length >= 8

    const strength =
      hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough
        ? "strong"
        : hasUpperCase && hasLowerCase && (hasNumbers || hasSpecialChar) && isLongEnough
          ? "medium"
          : "weak"

    setPasswordStrength(strength)
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Basic validation
      if (!email || !password) {
        throw new Error("Please fill in all fields")
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match")
      }

      if (passwordStrength === "weak") {
        throw new Error("Please choose a stronger password")
      }

      // Check if email exists using RPC function
      const { data: emailExists, error: emailError } = await supabase.rpc("email_exists", { check_email: email })

      if (emailError) {
        console.error("Error checking email:", emailError)
        throw new Error("Error checking email availability")
      }

      if (emailExists) {
        toast({
          variant: "destructive",
          title: "Account already exists",
          description: "An account with this email already exists. Please sign in instead.",
        })
        return
      }

      // Create the account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getRedirectUrl(),
        },
      })

      if (error) throw error

      if (data.user) {
        // Check for redirect URL
        const redirectTo = searchParams.get("redirectTo")
        
        // Store user data for onboarding
        sessionStorage.setItem(
          "pendingUserData",
          JSON.stringify({
            email,
            needsOnboarding: true,
            redirectTo: redirectTo, // Store redirect URL for after onboarding
          }),
        )

        // Check if email verification is required
        if (data.session) {
          // Email verification not required, redirect to onboarding
          router.push("/onboarding")
        } else {
          // Email verification required
          toast({
            title: "Success!",
            description: "Please check your email to confirm your account.",
          })
          router.push("/sign-in")
        }
      }
    } catch (error) {
      console.error("Signup error:", error)
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: error instanceof Error ? error.message : "An error occurred during signup",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      await signInWithGoogle()
      // The auth provider will handle the redirect
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error with Google sign-in",
        description: error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "weak":
        return "text-red-500"
      case "medium":
        return "text-yellow-500"
      case "strong":
        return "text-green-500"
      default:
        return "text-gray-400"
    }
  }

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case "weak":
        return "Weak password - use uppercase, lowercase, numbers, and special characters"
      case "medium":
        return "Medium strength - add special characters"
      case "strong":
        return "Strong password"
      default:
        return ""
    }
  }

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

          <CardHeader className="text-center px-8 md:px-6 pt-12 md:pt-6 pb-8 md:pb-6 relative z-10">
            {/* Animated logo/icon */}
            <motion.div
              className="flex justify-center mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="relative">
                <div className="w-20 h-20 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-green-500/25 transition-all duration-300 p-3 md:p-2">
                  <Image
                    src="/icon.png"
                    alt="OddSmash Logo"
                    width={48}
                    height={48}
                    className="object-contain md:w-10 md:h-10"
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
              <CardTitle className="text-3xl md:text-2xl text-white dark:text-white text-gray-900 mb-3 md:mb-2 font-bold">
                Join OddSmash
              </CardTitle>
              <CardDescription className="text-white/70 dark:text-white/70 text-gray-600 text-base md:text-sm">
                Get started with smarter sports betting insights
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-8 md:space-y-6 px-8 md:px-6 pb-12 md:pb-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6 md:space-y-4">


                {/* Email */}
                <div className="space-y-3 md:space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-gray-200 dark:text-gray-200 text-gray-700 flex items-center gap-2 text-base md:text-sm font-medium"
                  >
                    <Mail className="w-5 h-5 md:w-4 md:h-4" />
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
                    className="h-14 md:h-10 text-base md:text-sm bg-white/5 dark:bg-white/5 bg-gray-100 border-white/10 dark:border-white/10 border-gray-300 text-white dark:text-white text-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-500 placeholder:text-gray-400 focus-visible:ring-green-500 transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-50 rounded-2xl md:rounded-md"
                  />
                </div>

                {/* Password */}
                <div className="space-y-3 md:space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-gray-200 dark:text-gray-200 text-gray-700 flex items-center gap-2 text-base md:text-sm font-medium"
                  >
                    <Lock className="w-5 h-5 md:w-4 md:h-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading || isGoogleLoading}
                      className="h-14 md:h-10 text-base md:text-sm bg-white/5 dark:bg-white/5 bg-gray-100 border-white/10 dark:border-white/10 border-gray-300 text-white dark:text-white text-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-500 placeholder:text-gray-400 focus-visible:ring-green-500 pr-14 md:pr-10 transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-50 rounded-2xl md:rounded-md"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-4 md:px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading || isGoogleLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 md:h-4 md:w-4 text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors duration-300" />
                      ) : (
                        <Eye className="h-5 w-5 md:h-4 md:w-4 text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors duration-300" />
                      )}
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                  <AnimatePresence>
                    {password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`text-sm md:text-xs flex items-center gap-1 ${getPasswordStrengthColor()}`}
                      >
                        {passwordStrength === "strong" ? (
                          <Check className="w-4 h-4 md:w-3 md:h-3" />
                        ) : (
                          <X className="w-4 h-4 md:w-3 md:h-3" />
                        )}
                        {getPasswordStrengthText()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Confirm Password */}
                <div className="space-y-3 md:space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-gray-200 dark:text-gray-200 text-gray-700 flex items-center gap-2 text-base md:text-sm font-medium"
                    >
                      <Lock className="w-5 h-5 md:w-4 md:h-4" />
                      Confirm Password
                    </Label>
                    <AnimatePresence mode="wait">
                      {passwordsMatch !== null && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={cn(
                            "flex items-center gap-1 text-sm md:text-xs",
                            passwordsMatch ? "text-green-500" : "text-red-500",
                          )}
                        >
                          {passwordsMatch ? (
                            <>
                              <Check className="w-4 h-4 md:w-3 md:h-3" />
                              <span>Passwords match</span>
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 md:w-3 md:h-3" />
                              <span>Passwords don&apos;t match</span>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading || isGoogleLoading}
                      className={cn(
                        "h-14 md:h-10 text-base md:text-sm bg-white/5 dark:bg-white/5 bg-gray-100 border-white/10 dark:border-white/10 border-gray-300 text-white dark:text-white text-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-500 placeholder:text-gray-400 focus-visible:ring-green-500 pr-14 md:pr-10 transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-50 rounded-2xl md:rounded-md",
                        passwordsMatch === false && "border-red-500/50 focus-visible:ring-red-500",
                        passwordsMatch === true && "border-green-500/50 focus-visible:ring-green-500",
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-4 md:px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading || isGoogleLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 md:h-4 md:w-4 text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors duration-300" />
                      ) : (
                        <Eye className="h-5 w-5 md:h-4 md:w-4 text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors duration-300" />
                      )}
                      <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 md:h-10 text-base md:text-sm font-semibold bg-gradient-to-r from-green-500/90 to-emerald-600/90 hover:from-green-600/90 hover:to-emerald-700/90 text-white shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-2xl md:rounded-md"
                  disabled={isLoading || isGoogleLoading || passwordsMatch === false || passwordStrength === "weak"}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 md:h-4 md:w-4 border-b-2 border-white"></div>
                      Creating account...
                    </div>
                  ) : (
                    "Create Account"
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
                <span className="text-xs font-normal text-gray-500 dark:text-gray-500 text-gray-400 uppercase">
                  or continue with
                </span>
                <Separator className="flex-1 bg-white/10 dark:bg-white/10 bg-gray-300" />
              </div>

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                className="w-full h-14 md:h-10 text-base md:text-sm font-semibold mt-6 md:mt-4 border-white/10 dark:border-white/10 border-gray-300 text-white dark:text-white text-gray-900 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-100 relative transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-2xl md:rounded-md bg-transparent"
              >
                {isGoogleLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 md:h-4 md:w-4 border-b-2 border-white dark:border-white border-gray-900"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5 md:w-4 md:h-4 mr-3 md:mr-2" viewBox="0 0 24 24">
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
              className="text-center text-base md:text-sm text-gray-400 dark:text-gray-400 text-gray-600"
            >
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 underline-offset-4 hover:underline font-medium transition-colors duration-300"
              >
                Sign in
              </Link>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
