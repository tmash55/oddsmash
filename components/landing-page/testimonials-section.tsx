import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Star } from "lucide-react";

import { SectionTransition } from "../ui/section-transition";
import { ScrollFade } from "../ui/scroll-fade";

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="relative py-16 md:py-24 lg:py-32 overflow-hidden"
    >
      <SectionTransition position="top" className="z-10" />
      <div className="container space-y-12">
        <ScrollFade>
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Trusted by Bettors Everywhere
            </h2>
            <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              See what our users are saying about how SmashOdds has transformed
              their betting experience.
            </p>
          </div>
        </ScrollFade>
        <ScrollFade>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-primary text-primary"
                    />
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-muted-foreground">
                  &quot;SmashOdds has completely changed how I approach betting.
                  I&apos;ve found so much value by comparing odds across books.
                  The prop comparison tool alone has paid for my subscription
                  many times over.&quot;
                </p>
              </CardContent>
              <CardFooter>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>MJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Michael J.</p>
                    <p className="text-xs text-muted-foreground">
                      Member since 2023
                    </p>
                  </div>
                </div>
              </CardFooter>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-primary text-primary"
                    />
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-muted-foreground">
                  &quot;The promo calendar is a game-changer. I used to miss out
                  on so many good promos, but now I can plan my week around
                  them. The interface is clean and intuitive - exactly what I
                  needed.&quot;
                </p>
              </CardContent>
              <CardFooter>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>SR</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Sarah R.</p>
                    <p className="text-xs text-muted-foreground">
                      Member since 2022
                    </p>
                  </div>
                </div>
              </CardFooter>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-primary text-primary"
                    />
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-muted-foreground">
                  &quot;The parlay builder is incredible. Being able to see the
                  payout differences across books has saved me hundreds of
                  dollars. The historical trends feature also helps me make more
                  informed decisions.&quot;
                </p>
              </CardContent>
              <CardFooter>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>DT</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">David T.</p>
                    <p className="text-xs text-muted-foreground">
                      Member since 2023
                    </p>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        </ScrollFade>
      </div>
      <SectionTransition position="bottom" className="z-10" />
    </section>
  );
}
