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
                <AccordionTrigger>Is OddSmash really free?</AccordionTrigger>
                <AccordionContent>
                  Yep — 100% free to use with no sign-up required. Just head to
                  the tools and start comparing odds right away.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>
                  What sportsbooks are included?
                </AccordionTrigger>
                <AccordionContent>
                  OddsMash compares player props and parlays from all major U.S.
                  sportsbooks like DraftKings, FanDuel, Caesars, BetMGM, ESPN
                  Bet, and more. Coverage may vary based on your location.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>
                  How does the Parlay Builder work?
                </AccordionTrigger>
                <AccordionContent>
                  Add legs to your parlay and we&apos;ll instantly show you
                  which sportsbook is offering the highest payout. Then click to
                  add it directly to your betslip.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>
                  Do you update odds in real-time?
                </AccordionTrigger>
                <AccordionContent>
                  We update odds frequently throughout the day — and the closer
                  we get to game time, the more often we check for changes. This
                  ensures you&apos;re seeing the most accurate and current lines
                  when it matters most.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>What is the Promo Calendar?</AccordionTrigger>
                <AccordionContent>
                  Our upcoming Promo Calendar will highlight the best sportsbook
                  recurring promotions available each day — so you never miss a
                  bonus or boost again.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-6">
                <AccordionTrigger>
                  Can I bet directly on OddsMash?
                </AccordionTrigger>
                <AccordionContent>
                  No, OddsMash doesn&apos;t take bets — we show you where the
                  best lines are, then link you directly to the sportsbook to
                  place your bet. Always double check your bet with the
                  sportsbook before placing a bet.
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
