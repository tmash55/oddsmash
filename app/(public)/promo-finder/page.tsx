
"use client"

import Image from "next/image"
import { Gift, Copy, Check, ExternalLink, Info } from "lucide-react"
import { sportsbooks } from "@/data/sportsbooks"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function PromoFinderPage() {
  const novig = sportsbooks.find((b) => b.id === "novig")
  const novigHref = novig?.affiliate && novig.affiliateLink ? novig.affiliateLink : (novig?.url || "#")
  const promoCode = process.env.NEXT_PUBLIC_NOVIG_PROMO_CODE || "ODDSMASH"
  const [copied, setCopied] = useState(false)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Promo Finder</h1>
          <p className="text-muted-foreground mt-2">
            Hand-picked promotions from our partners. One-click to play using our affiliate links.
          </p>
        </div>

        {/* Novig Card (simple) */}
        <div className="rounded-2xl border bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-slate-950/80 dark:to-slate-900/80 backdrop-blur-sm border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-xl border bg-white/70 dark:bg-slate-900/60 border-gray-200 dark:border-slate-800 p-2">
                <Image src={novig?.logo || "/images/sports-books/novig.png"} alt="Novig" width={40} height={40} className="object-contain" />
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Novig</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Spend $5, get $50 in Novig Coins (new users)</p>
                  </div>
                  <Button asChild className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                    <a href={novigHref} target="_blank" rel="noopener noreferrer">
                      <Gift className="w-4 h-4 mr-2" />
                      Claim Offer
                    </a>
                  </Button>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                  <a
                    href={novigHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Terms apply — 21+ • New users
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}