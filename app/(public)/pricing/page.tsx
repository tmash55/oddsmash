import React from 'react'
import config from '@/config'
import ButtonCheckout from '@/components/ButtonCheckout'
import { Check } from 'lucide-react'

export default function PricingPage() {
  const plans = config.stripe.plans || []

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight">Choose your plan</h1>
        <p className="mt-2 text-gray-600">Unlock premium tools and insights with {config.appName}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <div className="rounded-xl border bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-semibold">Free</h3>
            <p className="text-gray-600 dark:text-slate-400">Get started with core features.</p>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-500">/mo</span>
            </div>
            <ul className="mt-6 space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Prop comparison (limited)</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Parlay builder (basic)</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Community access</span>
              </li>
            </ul>
            <div className="mt-8">
              <a href="/sign-up" className="inline-flex items-center justify-center h-11 w-full rounded-md bg-gray-900 text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-colors">
                Get Started
              </a>
            </div>
          </div>
        </div>

        {plans.map((plan) => (
          <div
            key={plan.priceId}
            className={`rounded-xl border bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden ${
              plan.isFeatured ? 'ring-2 ring-emerald-500' : ''
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                {plan.isFeatured ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-3 py-1 text-xs font-medium">
                    Most Popular
                  </span>
                ) : null}
              </div>
              <p className="text-gray-600 dark:text-slate-400">{plan.description}</p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-500">{plan.name.toLowerCase().includes('annual') ? '/yr' : '/mo'}</span>
                {plan.priceAnchor ? (
                  <span className="ml-2 line-through text-gray-400">${plan.priceAnchor}</span>
                ) : null}
              </div>

              {Array.isArray(plan.features) && plan.features.length > 0 ? (
                <ul className="mt-6 space-y-2">
                  {plan.features.map((f: any, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>{f?.name || String(f)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-8">
                <ButtonCheckout
                  priceId={plan.priceId}
                  mode="subscription"
                  label={`Get ${plan.name}`}
                  className="h-11"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-gray-500">
        Cancel anytime via the customer portal. Prices shown are in USD.
      </p>
    </div>
  )
}