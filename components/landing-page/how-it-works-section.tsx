"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Upload, Zap, Target, ArrowRight } from "lucide-react"
import Link from "next/link"

const steps = [
  {
    number: "1",
    title: "Upload",
    description: "Drag & drop or paste your screenshot",
    icon: Upload,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50",
  },
  {
    number: "2",
    title: "Scan",
    description: "Our AI parses your lines",
    icon: Zap,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50",
  },
  {
    number: "3",
    title: "Best Odds",
    description: "See the top book + EV in real time",
    icon: Target,
    color: "from-green-500 to-green-600",
    bgColor: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50",
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
      <div className="container px-4 md:px-6">
        <motion.div
          className="text-center space-y-4 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            How It Works in{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              3 Seconds
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">From screenshot to smarter bet in a click.</p>
        </motion.div>

        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Card
                className={`overflow-hidden ${step.bgColor} backdrop-blur-sm border-2 border-border/50 hover:shadow-lg transition-all duration-300 group`}
              >
                <CardContent className="p-8 text-center space-y-6 relative">
                  {/* Step Number in corner */}
                  <div className="absolute top-4 left-4">
                    <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">
                      {step.number}. {step.title}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="pt-4">
                    <div
                      className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-6 mb-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className={`overflow-hidden ${step.bgColor} backdrop-blur-sm border-2 border-border/50`}>
                <CardContent className="p-6 relative">
                  {/* Step Number in corner */}
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">
                      {step.number}. {step.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                      >
                        <step.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Enhanced CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <Button
            size="lg"
            className="h-14 px-8 text-base font-semibold rounded-2xl bg-gradient-to-r from-purple-500 to-green-500 hover:from-purple-600 hover:to-green-600 shadow-lg hover:shadow-xl transition-all duration-300 group"
            asChild
          >
            <Link href="#hero">
              See it live
              <ArrowRight className="w-5 h-5 ml-2 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
