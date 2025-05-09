"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Award,
  Users,
  Target,
  Clock,
  Building,
  MapPin,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Timeline } from "@/components/about/timeline";
import { ValueCard } from "@/components/about/value-card";
import { StatsCard } from "@/components/about/stats-card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import config from "@/config";

export default function AboutPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  const handleChange = (e: any) => {
    const { id, value } = e.target;
    // Convert hyphenated field ids to camelCase (first-name -> firstName)
    const fieldName = id.includes('-') 
      ? id.split('-').map((part: string, index: number) => 
          index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
        ).join('')
      : id;
    
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Send to an API route that would handle the email sending
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          to: config.gmail?.supportEmail,
        }),
      });

      if (response.ok) {
        toast({
          title: "Message sent successfully!",
          description: "We'll get back to you as soon as possible.",
          variant: "default",
          open: true,
        });

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          message: "",
        });
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Please try again later or email us directly.",
        variant: "destructive",
        open: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-background to-muted overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="border-primary/20 bg-primary/10 text-primary"
                >
                  Established 2025
                </Badge>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  We&apos;re on a mission to transform the sports betting
                  industry
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform helps bettors make smarter decisions by providing
                  transparent odds comparison and data-driven insights.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild>
                  <Link href="#our-story">
                    Our Story <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="#contact">Contact Us</Link>
                </Button>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end ">
              <div className="relative w-full max-w-[300px] sm:max-w-[400px] lg:max-w-[500px] aspect-square rounded-full overflow-hidden border-8 border-background shadow-xl hidden md:block">
                <Image
                  src="/icon.png"
                  alt="OddSmash Logo"
                  fill
                  className="object-contain p-4 bg-white"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px] opacity-10"></div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-12 md:py-16 lg:py-20 border-t">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <StatsCard
              icon={<Building className="h-6 w-6 text-primary" />}
              value="10+"
              label="Sportsbooks Integrated"
              description="With more being added regularly"
            />
            <StatsCard
              icon={<Target className="h-6 w-6 text-primary" />}
              value="2 Core Tools"
              label="Prop Comparison & Parlay Builder"
              description="Designed to find the best value bets fast"
            />
            <StatsCard
              icon={<Clock className="h-6 w-6 text-primary" />}
              value="2025 Launch"
              label="Early Access Phase"
              description="We're just getting started—features evolving weekly"
            />
            <StatsCard
              icon={<Users className="h-6 w-6 text-primary" />}
              value="Community First"
              label="Built With Bettors In Mind"
              description="We prioritize user feedback in everything we do"
            />
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section
        id="our-story"
        className="w-full py-12 md:py-24 lg:py-32 bg-muted/50"
      >
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/10 text-primary"
              >
                Our Journey
              </Badge>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Our Story
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                From a simple idea to an industry-leading platform
              </p>
            </div>
          </div>
          <div className="mx-auto max-w-4xl mt-12">
            <Timeline
              events={[
                {
                  year: "2024",
                  title: "Launched TrackKOTC.com",
                  description:
                    "We began our journey by building TrackKOTC, a leaderboard that tracked DraftKings' King of the Court promotion live. It quickly gained traction among NBA bettors.",
                },
                {
                  year: "2025",
                  title: "OddSmash.io Goes Live",
                  description:
                    "We officially launched OddSmash with tools like prop comparison and a multi-leg parlay builder, designed to help users shop odds more efficiently.",
                },
                {
                  year: "2025",
                  title: "King of the Playoffs Leaderboard",
                  description:
                    "We moved TrackKOTC.com over to OddSmash.io and created the King of the Playoffs leaderboard, expanding our live tracking capabilities for special DraftKings promotions.",
                },
                
              ]}
            />
          </div>
        </div>
      </section>

      {/* Mission & Values Section */}
      <section id="mission-values" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/10 text-primary"
              >
                Our Purpose
              </Badge>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Mission & Values
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                The principles that guide everything we do
              </p>
            </div>
          </div>

          <div className="mt-12">
            <Tabs defaultValue="mission" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mission">Our Mission</TabsTrigger>
                <TabsTrigger value="values">Our Values</TabsTrigger>
              </TabsList>
              <TabsContent
                value="mission"
                className="p-4 sm:p-6 border rounded-lg mt-6 bg-card"
              >
                <div className="space-y-4">
                  <h3 className="text-xl sm:text-2xl font-bold">
                    Empowering Smarter Betting Decisions
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Our mission is to transform the sports betting industry by
                    providing bettors with transparent, accurate information and
                    tools that help them make more informed decisions. We
                    believe in democratizing access to odds comparison and
                    analytics that were previously only available to
                    professionals.
                  </p>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    By helping users find the best odds and understand the true
                    value of their bets, we aim to create a more level playing
                    field between bettors and sportsbooks. Our platform is
                    designed to educate and empower users, promoting responsible
                    betting practices while maximizing potential returns.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="values" className="mt-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <ValueCard
                    icon={
                      <Award className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                    }
                    title="Transparency"
                    description="We believe in complete transparency in everything we do, from our odds data to our business practices."
                  />
                  <ValueCard
                    icon={
                      <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                    }
                    title="User-Centric"
                    description="Our users are at the heart of every decision we make. We're committed to creating tools that genuinely help them."
                  />
                  <ValueCard
                    icon={
                      <Target className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                    }
                    title="Accuracy"
                    description="We're obsessed with providing the most accurate, up-to-date information possible."
                  />
                  <ValueCard
                    icon={
                      <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                    }
                    title="Innovation"
                    description="We constantly push the boundaries of what's possible in sports betting technology."
                  />
                  <ValueCard
                    icon={
                      <Building className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                    }
                    title="Integrity"
                    description="We operate with the highest ethical standards and promote responsible betting practices."
                  />
                  <ValueCard
                    icon={
                      <MapPin className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                    }
                    title="Accessibility"
                    description="We believe powerful betting tools should be accessible to everyone, not just professionals."
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-start">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="border-primary/20 bg-primary/10 text-primary"
                >
                  Get In Touch
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Contact Us
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Have questions or feedback? We&apos;d love to hear from you.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                  <p className="text-muted-foreground">USA</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild>
                  <Link href={`mailto:${config.gmail?.supportEmail}`}>Send Email</Link>
                </Button>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end mt-8 lg:mt-0">
              <Card className="w-full max-w-md">
                <CardContent className="p-4 sm:p-6">
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="first-name"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          First name
                        </label>
                        <Input
                          id="first-name"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={handleChange}
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="last-name"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Last name
                        </label>
                        <Input
                          id="last-name"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={handleChange}
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="message"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Message
                      </label>
                      <Textarea
                        id="message"
                        placeholder="Your message here..."
                        className="min-h-[120px]"
                        value={formData.message}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Message"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
