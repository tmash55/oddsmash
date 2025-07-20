 "use client"

import { Card } from "@/components/ui/card"
import { Scale } from "lucide-react"

interface FuturesPageProps {
  params: {
    sport: string
  }
}

export default function FuturesPage({ params }: FuturesPageProps) {
  const { sport } = params

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <Card className="p-8 max-w-lg w-full">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Scale className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold">Futures Coming Soon</h2>
            <p className="text-muted-foreground">
              We&apos;re working hard to bring you comprehensive futures comparison.
              Check back soon for updates!
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
} 