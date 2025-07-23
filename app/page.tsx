"use client";

import { FaqSection } from "@/components/landing-page/faq-section";
import LandingFeaturesSection from "@/components/landing-page/features-section";
import { FoundersProgramSection } from "@/components/landing-page/founders-program-section";
import { HeroSection } from "@/components/landing-page/hero-section";
import { HowItWorksSection } from "@/components/landing-page/how-it-works-section";
import { LiveValuePlaysSection } from "@/components/landing-page/live-value-plays-section";
import { PainSolutionSection } from "@/components/landing-page/problem-section";
import { SportsbookTicker } from "@/components/landing-page/sportsbook-ticker";
import { StatsCTASection } from "@/components/landing-page/stats-cta-section";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden">
      <HeroSection />
      <SportsbookTicker />
      <PainSolutionSection />
      <section id="how-it-works">
        <HowItWorksSection/>
      </section>
      <section id="features">
        <LandingFeaturesSection/>
      </section>
      <StatsCTASection />
      <LiveValuePlaysSection />
      <section id="founders-beta">
        <FoundersProgramSection />
      </section>
      <FaqSection />
    </div>
  );
}
