"use client";

import { FaqSection } from "@/components/landing-page/faq-section";
import LandingFeaturesSection from "@/components/landing-page/features-section";
import { FoundersProgramSection } from "@/components/landing-page/founders-program-section";
import { HeroSectionV2 } from "@/components/landing-page/hero-section-v2";
import { HowItWorksSection } from "@/components/landing-page/how-it-works-section";
import { LiveValueShowcase } from "@/components/landing-page/live-value-showcase";
import { PainSolutionSection } from "@/components/landing-page/problem-section";
import { StatsCTASection } from "@/components/landing-page/stats-cta-section";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden">
      <HeroSectionV2 />
      <section id="features">
        <LandingFeaturesSection/>
        <StatsCTASection />
      </section>
      <LiveValueShowcase />
      <section id="founders-beta">
        <FoundersProgramSection />
      </section>
      
      <PainSolutionSection />
      <section id="how-it-works">
        <HowItWorksSection/>
      </section>
     
     
      
      
      <FaqSection />
    </div>
  );
}
