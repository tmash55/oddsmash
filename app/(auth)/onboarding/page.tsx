'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import OnboardingFlow from '@/components/auth/OnboardingFlow';
import { motion } from 'framer-motion';
import { createClient } from '@/libs/supabase/client';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

function OnboardingContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!loading) {
        if (!user) {
          router.push('/sign-in');
          return;
        }

        // Check for userData in URL params (from OAuth callback)
        const userDataParam = searchParams.get('userData');
        if (userDataParam) {
          try {
            const userData = JSON.parse(userDataParam);
            sessionStorage.setItem('pendingUserData', JSON.stringify(userData));
            setShouldShowOnboarding(true);
            
            // Clean up URL by removing the userData param
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('userData');
            window.history.replaceState({}, '', newUrl.toString());
          } catch (error) {
            console.error('Error parsing userData from URL:', error);
          }
        } else {
          // Check database for onboarding completion status
          const { data: preferences, error } = await supabase
            .from('user_preferences')
            .select('onboarding_completed')
            .eq('id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Error checking preferences:', error);
            // If there's an error, assume they need onboarding
            setShouldShowOnboarding(true);
          } else if (!preferences?.onboarding_completed) {
            // Store user data for onboarding
            sessionStorage.setItem('pendingUserData', JSON.stringify({
              email: user.email,
              firstName: user.user_metadata?.first_name || 
                        user.user_metadata?.full_name?.split(' ')[0] || '',
              needsOnboarding: true
            }));
            setShouldShowOnboarding(true);
          } else {
            router.push('/mlb/odds/player-props?market=home+runs');
          }
        }
        
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user, loading, router, searchParams, supabase]);

  const handleOnboardingComplete = () => {
    setShouldShowOnboarding(false);
    
    // Check for stored redirect URL
    const pendingData = sessionStorage.getItem('pendingUserData');
    let redirectTo = null;
    
    if (pendingData) {
      try {
        const userData = JSON.parse(pendingData);
        redirectTo = userData.redirectTo;
        // Clear the pending data
        sessionStorage.removeItem('pendingUserData');
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
    
    // Redirect to the stored URL or default location
    const destination = redirectTo || '/hit-rates';
    router.push(destination);
  };

  if (loading || isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white/60">Checking your account...</p>
        </div>
      </div>
    );
  }

  if (!shouldShowOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white/60">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <OnboardingFlow onComplete={handleOnboardingComplete} />
    </motion.div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
