'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/libs/supabase/client'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setStatus('error')
          setErrorMessage(error.message)
          return
        }

        if (data.session) {
          const user = data.session.user
          console.log('✅ Authentication successful:', user.email)
          
          // Check if this is a new user or existing user
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, name, onboarding_completed_at')
            .eq('id', user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            // Error other than "not found"
            console.error('Error fetching profile:', profileError)
          }

          // Check for redirect URL from the original sign-in attempt
          const redirectTo = searchParams.get('redirectTo')
          let destination = redirectTo || '/mlb/odds/player-props?market=home+runs'

          // For new users, we could redirect to onboarding, but since we set 
          // onboarding_completed to true by default, we'll go straight to the app
          if (!profile) {
            console.log('🆕 New user detected, welcome!')
            // Could add welcome logic here if needed
          } else {
            console.log('👋 Welcome back,', profile.name || user.email)
          }

          setStatus('success')
          
          // Small delay to show success state, then redirect
          setTimeout(() => {
            router.push(destination)
            router.refresh()
          }, 1000)
        } else {
          // No session found
          console.error('No session found after callback')
          setStatus('error')
          setErrorMessage('Authentication failed - no session found')
        }
      } catch (error) {
        console.error('Callback handling error:', error)
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred')
      }
    }

    handleAuthCallback()
  }, [router, searchParams, supabase])

  // Auto-redirect to sign-in on error after delay
  useEffect(() => {
    if (status === 'error') {
      const timer = setTimeout(() => {
        router.push('/sign-in')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [status, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="glassmorphic shadow-2xl backdrop-blur-sm rounded-xl border p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-6">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Completing sign-in...
              </h1>
              <p className="text-white/70">
                Please wait while we finish setting up your account.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Welcome to OddSmash! 🎉
              </h1>
              <p className="text-white/70">
                Redirecting you to the app...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="h-12 w-12 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Authentication Error
              </h1>
              <p className="text-white/70 mb-4">
                {errorMessage || 'Something went wrong during sign-in.'}
              </p>
              <p className="text-sm text-white/60">
                Redirecting to sign-in page in a few seconds...
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
} 