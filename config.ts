import themes from "daisyui/src/theming/themes";
import { ConfigProps } from "./types/config";

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
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1Niyy5AxyNprDp7iZIqEyD2h"
            : "price_456",
        name: "Starter",
        description: "Perfect for casual bettors or daily use",
        price: 99,
        priceAnchor: 149,
        features: [
          { name: "Access to Prop Comparison Tool" },
          { name: "Parlay Builder with Odds Sync" },
          { name: "Track Bets and Hit Rates" },
          { name: "Standard Market Support" },
        ],
      },
      {
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1O5KtcAxyNprDp7iftKnrrpw"
            : "price_456",
        isFeatured: true,
        name: "Advanced",
        description: "Unlock full features and premium tools",
        price: 149,
        priceAnchor: 299,
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
