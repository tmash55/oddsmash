"use client";

import { StickyCTABanner } from "@/components/landing-page/cta-section";
import { FaqSection } from "@/components/landing-page/faq-section";
import LandingFeaturesSection from "@/components/landing-page/features-section";

import { HeroSection } from "@/components/landing-page/hero-section2";
import { HowItWorks } from "@/components/landing-page/how-it-works";
import { ProblemSection } from "@/components/landing-page/problem-section";
import { SocialProofSection } from "@/components/landing-page/social-proof-section";
import { TestimonialsSection } from "@/components/landing-page/testimonials-section";
import { ValuePropositionGrid } from "@/components/landing-page/value-proposition-grid";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden">
      <HeroSection />
      <ProblemSection />
      <SocialProofSection />
      <ValuePropositionGrid />
      <LandingFeaturesSection/>
      <HowItWorks />
      <FaqSection />
    </div>
  );
}
