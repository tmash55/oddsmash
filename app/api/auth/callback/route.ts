import { createClient } from '@/libs/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import config from '@/config'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/hit-rates'

  console.log('🔄 Auth callback started:', { code: !!code, next, origin })

  if (code) {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      console.log('✅ User authenticated:', { 
        userId: data.user.id, 
        email: data.user.email,
        metadata: data.user.user_metadata 
      })
      
      // Check if user needs onboarding
      const { data: preferences, error: prefError } = await supabase
        .from('user_preferences')
        .select('onboarding_completed, id, preferred_sportsbooks, state_code')
        .eq('id', data.user.id)
        .maybeSingle()

      console.log('📊 Preferences check:', { 
        preferences, 
        prefError: prefError?.message,
        needsOnboarding: !preferences?.onboarding_completed 
      })

      // If user doesn't have preferences or hasn't completed onboarding
      if (!preferences?.onboarding_completed) {
        console.log('🎯 Redirecting to onboarding - user needs setup')
        
        // Store user data for onboarding
        const userData = {
          email: data.user.email,
          firstName: data.user.user_metadata?.first_name || data.user.user_metadata?.full_name?.split(' ')[0] || '',
          needsOnboarding: true
        }
        
        // We can't directly set sessionStorage on server, so we'll pass it as a query param
        const onboardingUrl = new URL('/onboarding', origin)
        onboardingUrl.searchParams.set('userData', JSON.stringify(userData))
        
        console.log('🚀 Onboarding redirect URL:', onboardingUrl.toString())
        return NextResponse.redirect(onboardingUrl)
      }
      
      console.log('✨ User completed onboarding, redirecting to:', next)
      
      // User has completed onboarding, redirect to next page
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      console.error('❌ Auth error:', error)
    }
  } else {
    console.log('⚠️ No auth code provided')
  }

  console.log('🔄 Redirecting to auth error page')
  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}