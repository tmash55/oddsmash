import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { GradientBackground } from "../ui/gradient-background";
import { SectionTransition } from "../ui/section-transition";
import { ScrollFade } from "../ui/scroll-fade";

export function FaqSection() {
  return (
    <section
      id="faq"
      className="relative bg-muted/50 py-16 md:py-24 lg:py-32 overflow-hidden"
    >
      <GradientBackground className="opacity-30" />
      <SectionTransition position="top" className="z-10" />
      <div className="container space-y-12">
        <ScrollFade>
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Frequently Asked Questions
            </h2>
            <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Everything you need to know about SmashOdds and our betting tools.
            </p>
          </div>
        </ScrollFade>
        <ScrollFade>
          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  What sportsbooks do you compare?
                </AccordionTrigger>
                <AccordionContent>
                  We compare odds and promotions from all major U.S.
                  sportsbooks, including but not limited to DraftKings, FanDuel,
                  BetMGM, Caesars, PointsBet, and more. Our coverage varies by
                  state due to different legalization status.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Is SmashOdds free to use?</AccordionTrigger>
                <AccordionContent>
                  We offer both free and premium tiers. The free tier gives you
                  access to basic odds comparison, while our premium
                  subscription unlocks all features including the promo
                  calendar, parlay builder, and historical trends.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>
                  How often are the odds updated?
                </AccordionTrigger>
                <AccordionContent>
                  Our odds are updated in near real-time, typically within 1-2
                  minutes of any change at the sportsbooks. This ensures you
                  always have the most current information when making betting
                  decisions.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>What sports do you cover?</AccordionTrigger>
                <AccordionContent>
                  We currently cover all major U.S. sports including NFL, NBA,
                  MLB, NHL, and NCAA football and basketball. We also cover
                  popular international sports like soccer, tennis, golf, and
                  MMA/UFC.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>
                  Can I place bets directly through SmashOdds?
                </AccordionTrigger>
                <AccordionContent>
                  No, SmashOdds is an odds comparison and betting tools
                  platform. We provide links to the sportsbooks where you can
                  place your bets, but we do not handle any betting transactions
                  ourselves.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-6">
                <AccordionTrigger>
                  How do I get started with SmashOdds?
                </AccordionTrigger>
                <AccordionContent>
                  Simply create a free account to start using our basic
                  features. You can explore the platform and decide if you want
                  to upgrade to our premium tier for access to all tools and
                  features.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollFade>
      </div>
      <SectionTransition position="bottom" className="z-10" />
    </section>
  );
}
