import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Mail,
  Send,
  Twitter,
  Users,
  BarChart3,
  Zap,
  HelpCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FaqSection } from "@/components/landing-page/faq-section";

export const metadata: Metadata = {
  title: "Contact Us | OddSmash",
  description:
    "Get in touch with the OddSmash team for support, feedback, or partnership opportunities.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-background to-muted overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="border-primary/20 bg-primary/10 text-primary"
                >
                  Get In Touch
                </Badge>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  We&apos;d Love To Hear From You
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Have questions, feedback, or need support? Our team is here to
                  help you get the most out of OddSmash.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild>
                  <a href="#contact-form">
                    Send Message <Send className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="#faq">View FAQs</a>
                </Button>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[500px] aspect-video rounded-lg overflow-hidden border-8 border-background shadow-xl">
                <Image
                  src="/placeholder.svg?height=600&width=800"
                  alt="Contact support team"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px] opacity-10"></div>
      </section>

      {/* Email Contact Card */}
      <section className="w-full py-12 md:py-16 border-t">
        <div className="container px-4 md:px-6">
          <Card className="bg-card max-w-2xl mx-auto">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Email Us</CardTitle>
              <CardDescription className="text-base">
                We&apos;re a small team dedicated to providing the best service
                possible. While we don&apos;t have set hours, we check our
                emails regularly and will get back to you as soon as we can.
              </CardDescription>
              <a
                href="mailto:support@oddsmash.io"
                className="text-primary hover:underline font-medium text-lg"
              >
                support@oddsmash.io
              </a>
              <div className="flex items-center justify-center mt-2">
                <a
                  href="https://twitter.com/oddsmash"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                  <span>@oddsmash</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Form & About Us Section */}
      <section
        id="contact-form"
        className="w-full py-12 md:py-24 lg:py-32 bg-muted/50"
      >
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 lg:grid-cols-2 items-start">
            <div>
              <div className="space-y-2 mb-8">
                <h2 className="text-3xl font-bold tracking-tighter">
                  Send Us a Message
                </h2>
                <p className="text-muted-foreground">
                  Fill out the form below and we&apos;ll get back to you as soon
                  as possible.
                </p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="first-name"
                          className="text-sm font-medium"
                        >
                          First name
                        </label>
                        <Input id="first-name" placeholder="John" required />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="last-name"
                          className="text-sm font-medium"
                        >
                          Last name
                        </label>
                        <Input id="last-name" placeholder="Doe" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-sm font-medium">
                        Subject
                      </label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">
                            General Inquiry
                          </SelectItem>
                          <SelectItem value="support">
                            Technical Support
                          </SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                          <SelectItem value="partnership">
                            Partnership Opportunity
                          </SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium">
                        Message
                      </label>
                      <Textarea
                        id="message"
                        placeholder="Your message here..."
                        className="min-h-[150px]"
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter">
                  About Our Team
                </h2>
                <p className="text-muted-foreground">
                  We&apos;re a small, dedicated team of sports betting
                  enthusiasts and tech experts based in the USA.
                </p>
              </div>

              <div className="grid gap-6">
                <Card>
                  <CardContent className="p-6 flex flex-col space-y-4">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">Small Team, Big Impact</h3>
                        <p className="text-muted-foreground">
                          As a small team, we&apos;re able to move quickly and
                          respond to user feedback. We&apos;re passionate about
                          creating the best sports betting tools possible.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex flex-col space-y-4">
                    <div className="flex items-start gap-3">
                      <BarChart3 className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">Data-Driven Approach</h3>
                        <p className="text-muted-foreground">
                          We believe in the power of data to transform the
                          betting experience. Our tools help you make more
                          informed decisions based on real-time odds and
                          statistics.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex flex-col space-y-4">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">Constantly Improving</h3>
                        <p className="text-muted-foreground">
                          We&apos;re always working to enhance our platform with
                          new features and improvements. Your feedback helps
                          shape the future of OddSmash.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold">Follow Us</h3>
                <a
                  href="https://twitter.com/trackkotc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] px-4 py-2 rounded-md transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                  <span>@trackkotc on Twitter</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="w-full py-12 md:py-24 lg:py-32">
        <FaqSection />
      </section>
    </div>
  );
}
