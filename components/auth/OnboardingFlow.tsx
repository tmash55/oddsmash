'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/libs/supabase/client';
import { useUserPreferences, STATE_CODES, LEGAL_BETTING_STATES } from '@/hooks/use-user-preferences';
import { sportsbooks } from '@/data/sportsbooks';
import { MapPin, CreditCard, Sparkles, ArrowRight, Check, X, BarChart3, Target, TrendingUp, Camera, Brain } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

interface OnboardingFlowProps {
  onComplete: () => void;
}

type OnboardingStep = 'welcome' | 'state' | 'sportsbooks' | 'complete';

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedSportsbooks, setSelectedSportsbooks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const { 
    setUserState, 
    setSportsbooks, 
    completeOnboarding, 
    isAuthenticated,
    preferences 
  } = useUserPreferences();
  const { theme } = useTheme();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // Get most popular sportsbooks first
  const popularSportsbooks = sportsbooks.filter(sb => 
    ['draftkings', 'fanduel', 'betmgm', 'williamhill_us', 'espnbet', 'fanatics'].includes(sb.id)
  );
  const otherSportsbooks = sportsbooks.filter(sb => 
    !['draftkings', 'fanduel', 'betmgm', 'williamhill_us', 'espnbet', 'fanatics'].includes(sb.id)
  );
  const orderedSportsbooks = [...popularSportsbooks, ...otherSportsbooks];

  // Theme-based styles
  const isDark = theme === 'dark';
  const bgClass = isDark 
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
    : 'min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100';
  const cardClass = isDark 
    ? 'bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl' 
    : 'bg-white/80 backdrop-blur-xl border-gray-200 shadow-2xl';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-white/70' : 'text-gray-600';
  const textMuted = isDark ? 'text-white/60' : 'text-gray-500';

  useEffect(() => {
    const pendingData = sessionStorage.getItem('pendingUserData');
    if (pendingData) {
      setUserData(JSON.parse(pendingData));
    }
  }, []);

  const handleStateSelection = async (stateCode: string) => {
    setSelectedState(stateCode);
    // Save state to database immediately if user is authenticated
    if (isAuthenticated) {
      await setUserState(stateCode);
    }
  };

  const handleSportsbookToggle = (sportsbookId: string) => {
    setSelectedSportsbooks(prev => 
      prev.includes(sportsbookId) 
        ? prev.filter(id => id !== sportsbookId)
        : [...prev, sportsbookId]
    );
  };

  const handleSelectAll = () => {
    setSelectedSportsbooks(orderedSportsbooks.map(sb => sb.id));
  };

  const handleSelectNone = () => {
    setSelectedSportsbooks([]);
  };

  const savePreferencesToDatabase = async () => {
    try {
      if (!isAuthenticated) {
        console.log('No authenticated user found, completing locally');
        return true;
      }

      // Use the new hook methods to save preferences
      let success = true;
      
      if (selectedState) {
        success = success && await setUserState(selectedState);
      }
      
      if (selectedSportsbooks.length > 0) {
        success = success && await setSportsbooks(selectedSportsbooks);
      }
      
      // Mark onboarding as completed
      success = success && await completeOnboarding();

      if (success) {
        sessionStorage.removeItem('pendingUserData');
      }
      
      return success;
    } catch (error) {
      console.error('Error saving preferences:', error);
      return false;
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    try {
      const saved = await savePreferencesToDatabase();
      
      if (saved) {
        toast({
          title: "Welcome to OddSmash! 🎉",
          description: "Your preferences have been saved. Let's start finding you the best odds!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error saving preferences",
          description: "We'll use your local preferences for now. You can update them later in settings.",
        });
      }
      
      onComplete();
      router.push('/hit-rates');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Don't worry, we'll use your preferences locally for now.",
      });
      
      onComplete();
      router.push('/hit-rates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      // Mark onboarding as completed even when skipping
      if (isAuthenticated) {
        await completeOnboarding();
      }
    } catch (error) {
      console.error('Error saving skip status:', error);
    }
    
    onComplete();
    router.push('/hit-rates');
  };

  const getStepProgress = () => {
    const steps = ['welcome', 'state', 'sportsbooks', 'complete'];
    return ((steps.indexOf(currentStep) + 1) / steps.length) * 100;
  };

  const renderWelcomeStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      {/* Skip button */}
      <div className="flex justify-end mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSkip}
          className={isDark ? "text-white/60 hover:text-white hover:bg-white/10" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}
        >
          Skip for now
        </Button>
      </div>

      <Card className={cardClass}>
        <CardHeader className="text-center pb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Image
              src="/icon.png"
              alt="OddSmash Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <CardTitle className={`text-3xl font-bold ${textPrimary} mb-2`}>
            Welcome to OddSmash{userData?.firstName ? `, ${userData.firstName}` : ''} 👋
          </CardTitle>
          <CardDescription className={`${textSecondary} text-lg`}>
            Let's customize your betting experience to help you find the smartest plays and best value.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Features grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center space-y-3">
              <div className={`w-12 h-12 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'} rounded-lg flex items-center justify-center mx-auto`}>
                <Brain className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <h3 className={`font-semibold ${textPrimary}`}>Smart Hit Rate Insights</h3>
              <p className={`text-sm ${textMuted}`}>See how players are trending and shop by hit rates like 5+ game streaks, 80% lines, and more.</p>
            </div>
            <div className="text-center space-y-3">
              <div className={`w-12 h-12 ${isDark ? 'bg-green-500/20' : 'bg-green-100'} rounded-lg flex items-center justify-center mx-auto`}>
                <TrendingUp className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h3 className={`font-semibold ${textPrimary}`}>Best Odds Comparison</h3>
              <p className={`text-sm ${textMuted}`}>Compare your picks across all major sportsbooks — get the highest payout, always.</p>
            </div>
            <div className="text-center space-y-3">
              <div className={`w-12 h-12 ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'} rounded-lg flex items-center justify-center mx-auto`}>
                <Camera className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <h3 className={`font-semibold ${textPrimary}`}>AI Betslip Scanner</h3>
              <p className={`text-sm ${textMuted}`}>Upload a screenshot and see how to improve your odds — or help your followers do the same.</p>
            </div>
          </div>

          {/* Amazon-style marketplace messaging */}
          <div className={`text-center p-4 rounded-lg mb-6 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} font-medium`}>
              Browse the best player props, add picks to your betslip, and check out with the top payout.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className={`${textMuted} font-medium`}>
              ✨ Just 2 quick questions to personalize your experience.
            </p>
            <Button 
              onClick={() => setCurrentStep('state')}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-medium"
            >
              Let's Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderStateStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-lg mx-auto"
    >
      {/* Progress bar */}
      <div className="mb-6">
        <div className={`flex justify-between text-sm ${textMuted} mb-2`}>
          <span>Step 1 of 3</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSkip}
            className={`${isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} h-auto p-0`}
          >
            Skip
          </Button>
        </div>
        <div className={`w-full ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full h-2`}>
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getStepProgress()}%` }}
          />
        </div>
      </div>

      <Card className={cardClass}>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <CardTitle className={`text-2xl ${textPrimary}`}>
            What state are you betting from?
          </CardTitle>
          <CardDescription className={textSecondary}>
            We'll show you legal sportsbooks in your area
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Select value={selectedState} onValueChange={handleStateSelection}>
            <SelectTrigger className={`${isDark ? 'bg-white/5 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'} h-12`}>
              <SelectValue placeholder="Select your state" />
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-gray-900 border-white/10 max-h-60" : "bg-white border-gray-200 max-h-60"}>
              <SelectItem value="none" className={`${isDark ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'}`}>
                🌍 None / Outside US
              </SelectItem>
              {Object.entries(STATE_CODES)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([stateName, stateCode]) => (
                <SelectItem 
                  key={stateCode} 
                  value={stateCode} 
                  className={`${isDark ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'} flex items-center justify-between`}
                >
                  <span className="flex items-center justify-between w-full">
                    {stateName.charAt(0).toUpperCase() + stateName.slice(1)}
                    {LEGAL_BETTING_STATES.includes(stateCode) && (
                      <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-400 border-green-500/30">
                        Legal
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedState && selectedState !== 'none' && !LEGAL_BETTING_STATES.includes(selectedState) && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-400 text-center">
                ⚠️ Sports betting isn't currently legal in {Object.entries(STATE_CODES).find(([_, code]) => code === selectedState)?.[0]}. 
                You can still use OddSmash for research and analysis!
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('welcome')}
              className={`flex-1 ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Back
            </Button>
            <Button 
              onClick={() => setCurrentStep('sportsbooks')}
              disabled={!selectedState}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderSportsbooksStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      {/* Progress bar */}
      <div className="mb-4 sm:mb-6">
        <div className={`flex justify-between text-sm ${textMuted} mb-2`}>
          <span>Step 2 of 3</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSkip}
            className={`${isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} h-auto p-0`}
          >
            Skip
          </Button>
        </div>
        <div className={`w-full ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full h-2`}>
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getStepProgress()}%` }}
          />
        </div>
      </div>

      <Card className={cardClass}>
        <CardHeader className="text-center pb-4 sm:pb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <CardTitle className={`text-xl sm:text-2xl ${textPrimary}`}>
            Which sportsbooks do you use?
          </CardTitle>
          <CardDescription className={`${textSecondary} text-sm sm:text-base`}>
            We'll tailor your experience to show you the best payouts from your favorite sportsbooks — and highlight where better odds exist.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Quick actions - 2 column layout */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="default"
              onClick={handleSelectAll}
              className={`h-11 sm:h-10 ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <Check className="w-4 h-4 mr-2" />
              Select All
            </Button>
            <Button 
              variant="outline" 
              size="default"
              onClick={handleSelectNone}
              className={`h-11 sm:h-10 ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>

          {/* Sportsbooks grid - Cleaner design */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 max-h-48 sm:max-h-60 overflow-y-auto px-1">
            {orderedSportsbooks.map((sportsbook, index) => (
              <motion.div
                key={sportsbook.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`relative p-2 rounded-lg border-2 transition-all cursor-pointer hover:scale-105 hover:shadow-lg min-h-[80px] sm:min-h-[90px] ${
                  selectedSportsbooks.includes(sportsbook.id)
                    ? 'bg-blue-500/20 border-blue-500/60 shadow-lg shadow-blue-500/25 ring-1 ring-blue-500/30'
                    : isDark 
                      ? 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10 hover:shadow-white/10'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-gray-200/50'
                }`}
                onClick={() => handleSportsbookToggle(sportsbook.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Logo */}
                <div className={`aspect-square ${isDark ? 'bg-white/10' : 'bg-gray-50'} rounded-md mb-1 flex items-center justify-center overflow-hidden transition-all max-w-[32px] max-h-[32px] mx-auto ${
                  selectedSportsbooks.includes(sportsbook.id) ? 'ring-1 ring-blue-500/30' : ''
                }`}>
                  <Image
                    src={sportsbook.logo}
                    alt={sportsbook.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>

                {/* Name */}
                <h3 className={`text-xs font-medium ${textPrimary} text-center leading-tight line-clamp-2`}>
                  {sportsbook.name}
                </h3>

                {/* Popular badge with better icon */}
                {popularSportsbooks.includes(sportsbook) && (
                  <Badge 
                    variant="secondary" 
                    className="absolute top-1 left-1 bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs px-1 py-0.5"
                  >
                    {/* Icon placeholder - add emoji/icon here later */}
                  </Badge>
                )}

                {/* Single checkmark overlay for selection */}
                {selectedSportsbooks.includes(sportsbook.id) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-blue-500/10 rounded-lg"
                  >
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Selection info and nudge - Condensed */}
          <div className="space-y-1 sm:space-y-2">
            <div className={`text-sm ${textMuted} text-center`}>
              Selected {selectedSportsbooks.length} of {orderedSportsbooks.length} sportsbooks
            </div>
            <div className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'} text-center font-medium px-2 sm:px-4`}>
              💡 The more sportsbooks you select, the better your chances of finding max value.
            </div>
          </div>

          {/* Buttons - Larger and more prominent */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setCurrentStep('state')}
              className={`flex-1 h-14 sm:h-12 text-base ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Back
            </Button>
            <Button 
              size="lg"
              onClick={async () => {
                // Save sportsbooks to database before proceeding
                if (isAuthenticated && selectedSportsbooks.length > 0) {
                  await setSportsbooks(selectedSportsbooks);
                }
                setCurrentStep('complete');
              }}
              className="flex-1 h-14 sm:h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
            >
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Secondary actions */}
          <div className="space-y-2 sm:space-y-3">
            {/* No sportsbooks option - Large touch-friendly button on mobile */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="default"
                onClick={handleSelectNone}
                className={`h-10 px-6 ${isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                I don't use any yet
              </Button>
            </div>
            
            {/* Helpful microcopy */}
            <div className={`text-xs ${textMuted} text-center px-2 sm:px-4`}>
              You can change your sportsbook list anytime in your settings.
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderCompleteStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-lg mx-auto"
    >
      {/* Progress bar */}
      <div className="mb-6">
        <div className={`flex justify-between text-sm ${textMuted} mb-2`}>
          <span>Step 3 of 3</span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentStep('sportsbooks')}
            className={`${isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} h-auto p-0 text-sm`}
          >
            ← Edit Info
          </Button>
        </div>
        <div className={`w-full ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full h-2`}>
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <Card className={cardClass}>
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-white" />
          </div>
          <CardTitle className={`text-2xl ${textPrimary}`}>You're All Set!</CardTitle>
          <CardDescription className={textSecondary}>
            Your personalized OddSmash experience is ready
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Celebratory personalization impact */}
          <div className="text-center space-y-2">
            <h3 className={`text-lg font-semibold ${textPrimary}`}>
              🎉 You're ready to find the smartest bets, faster.
            </h3>
            <p className={`text-sm ${textSecondary}`}>
              We've tailored your experience based on your preferences.
            </p>
          </div>

          {/* Summary - with capitalized states */}
          <div className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4 space-y-3`}>
            <div className="flex items-center justify-between text-sm">
              <span className={textMuted}>Location:</span>
              <span className={`${textPrimary} font-medium`}>
                {selectedState === 'none' 
                  ? 'Outside US' 
                  : Object.entries(STATE_CODES).find(([_, code]) => code === selectedState)?.[0]?.toUpperCase() || 'Not set'
                }
                {selectedState && selectedState !== 'none' && LEGAL_BETTING_STATES.includes(selectedState) && (
                  <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    Legal
                  </Badge>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={textMuted}>Sportsbooks:</span>
              <span className={`${textPrimary} font-medium`}>
                {selectedSportsbooks.length} selected
              </span>
            </div>
          </div>

          {/* Pro upgrade hint - improved copy */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
            <h3 className={`font-semibold ${textPrimary} mb-2`}>🚀 Ready to unlock more?</h3>
            <p className={`text-sm ${textMuted} mb-3`}>
              Unlock full hit rate history, AI betslip scanning, and powerful filters to go deeper and win smarter.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              onClick={() => router.push('/pricing')}
            >
              View Pro Features
            </Button>
          </div>

          {/* Single prominent CTA */}
          <div className="space-y-3">
            <Button 
              onClick={handleComplete}
              disabled={isLoading}
              size="lg"
              className="w-full h-14 text-base bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
            >
              {isLoading ? 'Setting up...' : 'Start Betting Smarter'}
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
            
            {/* Reassuring microcopy */}
            <div className={`text-xs ${textMuted} text-center px-4`}>
              You can update your location or sportsbook list anytime from Settings.
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className={`${bgClass} flex items-center justify-center p-6`}>
      <AnimatePresence mode="wait">
        {currentStep === 'welcome' && renderWelcomeStep()}
        {currentStep === 'state' && renderStateStep()}
        {currentStep === 'sportsbooks' && renderSportsbooksStep()}
        {currentStep === 'complete' && renderCompleteStep()}
      </AnimatePresence>
    </div>
  );
}
