import themes from "daisyui/src/theming/themes";
import { ConfigProps } from "./types/config";

const starterPriceId =
  process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PASS_PRICE_ID ||
  (process.env.NODE_ENV === "development"
    ? "price_1Niyy5AxyNprDp7iZIqEyD2h"
    : "price_456");

const advancedPriceId =
  process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ||
  (process.env.NODE_ENV === "development"
    ? "price_1O5KtcAxyNprDp7iftKnrrpw"
    : "price_456");

const config = {
  appName: "OddSmash",
  appDescription:
    "Compare odds, build parlays, and smash value across sportsbooks with ease. OddSmash is your all-in-one betting companion.",
  domainName: "oddsmash.io", // <-- update this to your live domain
  crisp: {
    id: "",
    onlyShowOnRoutes: ["/"],
  },
  stripe: {
    plans: [
      {
        priceId: advancedPriceId,
        isFeatured: true,
        name: "Pro Monthly",
        description: "Unlock premium tools and insights, billed monthly",
        price: 20,
        priceAnchor: 24,
        features: [
          { name: "Access to Prop Comparison Tool" },
          { name: "Parlay Builder with Odds Sync" },
          { name: "Track Bets and Hit Rates" },
          { name: "Standard Market Support" },
        ],
      },
      {
        priceId: starterPriceId,
        name: "Pro Annual",
        description: "Best value: 12 months for the price of 10",
        price: 200,
        priceAnchor: 240,
        features: [
          { name: "All Starter Features" },
          { name: "Advanced Filters & Smart Alerts" },
          { name: "DeepLink Betslip Support" },
          { name: "Custom Odds & Line Notifications" },
          { name: "Community Tools (coming soon)" },
          { name: "Priority Support" },
        ],
      },
    ],
  },
  aws: {
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  gmail: {
    supportEmail: "support@oddsmash.io",
  },
  resend: {
    fromNoReply: `OddSmash <noreply@oddsmash.io>`,
    fromAdmin: `Support at OddSmash <support@oddsmash.io>`,
    supportEmail: "support@oddsmash.io",
  },
  colors: {
    theme: "light",
    main: themes["light"]["primary"],
  },
  auth: {
    loginUrl: "/sign-in",
    callbackUrl: "/mlb/odds/player-props?market=home+runs", // Default to MLB for now
  },
} as ConfigProps;

export default config;
