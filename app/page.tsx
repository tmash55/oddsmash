"use client";

import { CtaSection } from "@/components/landing-page/cta-section";
import { FaqSection } from "@/components/landing-page/faq-section";
import { FeaturesSection } from "@/components/landing-page/features-section";
import { HeroSection } from "@/components/landing-page/hero-section";
import { TestimonialsSection } from "@/components/landing-page/testimonials-section";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden">
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
    </div>
  );
}
