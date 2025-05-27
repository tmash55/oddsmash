"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import AuthCard from '@/components/auth/AuthCard';

import { useAuth } from "@/components/auth/auth-provider"
import { motion } from "framer-motion"
import SignUpForm from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is already authenticated, redirect them to dashboard
    if (user && !loading) {
      router.push('/hit-rates')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <motion.div 
      className="flex min-h-svh w-full items-center justify-center p-6 md:p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-md">
        <SignUpForm />
      </div>
    </motion.div>
  )
} 