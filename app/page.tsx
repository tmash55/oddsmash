"use client";

import { StickyCTABanner } from "@/components/landing-page/cta-section";
import { FaqSection } from "@/components/landing-page/faq-section";
import LandingFeaturesSection from "@/components/landing-page/features-section";

import { HeroSection } from "@/components/landing-page/hero-section";
import { HowItWorks } from "@/components/landing-page/how-it-works";
import { HowItWorksSection } from "@/components/landing-page/how-it-works-section";
import { LiveValuePlaysSection } from "@/components/landing-page/live-value-plays-section";
import { PainSolutionSection } from "@/components/landing-page/problem-section";
import { SocialProofSection } from "@/components/landing-page/social-proof-section";
import { SportsbookTicker } from "@/components/landing-page/sportsbook-ticker";
import { StatsCTASection } from "@/components/landing-page/stats-cta-section";
import { TestimonialsSection } from "@/components/landing-page/testimonials-section";
import { ValuePropositionGrid } from "@/components/landing-page/value-proposition-grid";
import { S } from "@upstash/redis/zmscore-BshEAkn7";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden">
      <HeroSection />
      <SportsbookTicker />
      <PainSolutionSection />
      <HowItWorksSection/>
      <LandingFeaturesSection/>
      <StatsCTASection />
      <LiveValuePlaysSection />
      <HowItWorks />
      <FaqSection />
    </div>
  );
}
