import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { GradientBackground } from "../ui/gradient-background";
import { SectionTransition } from "../ui/section-transition";
import { ScrollFade } from "../ui/scroll-fade";

export function CtaSection() {
  return (
    <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
      <GradientBackground />
      <SectionTransition position="top" className="z-10" />
      <div className="container">
        <ScrollFade>
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ready to Smash the Odds?
            </h2>
            <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Join thousands of bettors who are finding the best odds and making
              smarter betting decisions with SmashOdds.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="#">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#">View Pricing</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              No credit card required. Start with a free account today.
            </p>
          </div>
        </ScrollFade>
      </div>
      <SectionTransition position="bottom" className="z-10" />
    </section>
  );
}
