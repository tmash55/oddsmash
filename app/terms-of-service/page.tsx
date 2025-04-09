import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

// CHATGPT PROMPT TO GENERATE YOUR TERMS & SERVICES — replace with your own data 👇

// 1. Go to https://chat.openai.com/
// 2. Copy paste bellow
// 3. Replace the data with your own (if needed)
// 4. Paste the answer from ChatGPT directly in the <pre> tag below

// You are an excellent lawyer.

// I need your help to write a simple Terms & Services for my website. Here is some context:
// - Website: https://shipfa.st
// - Name: ShipFast
// - Contact information: marc@shipfa.st
// - Description: A JavaScript code boilerplate to help entrepreneurs launch their startups faster
// - Ownership: when buying a package, users can download code to create apps. They own the code but they do not have the right to resell it. They can ask for a full refund within 7 day after the purchase.
// - User data collected: name, email and payment information
// - Non-personal data collection: web cookies
// - Link to privacy-policy: https://shipfa.st/privacy-policy
// - Governing Law: France
// - Updates to the Terms: users will be updated by email

// Please write a simple Terms & Services for my site. Add the current date. Do not add or explain your reasoning. Answer:

export const metadata = getSEOTags({
  title: `Terms and Conditions | ${config.appName}`,
  canonicalUrlRelative: "/tos",
});

const TOS = () => {
  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
        <Link href="/" className="btn btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Terms and Conditions for {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Terms of Service
Effective Date: April 8, 2025

Welcome to Oddsmash! These Terms of Service (“Terms”) govern your use of our website and tools.

1. About Oddsmash
Oddsmash is a sports betting analytics platform designed to help users compare player props, build parlays, identify promotions, and shop for the best odds across major U.S. sportsbooks. Our tools are intended for informational and entertainment purposes only. Oddsmash does not facilitate, process, or accept any form of bets or wagers.

2. Disclaimer
You are solely responsible for verifying all betting selections and lines once redirected to a sportsbook. Odds, props, and market values displayed on Oddsmash may differ from those available on sportsbook websites due to frequent changes and updates.
Oddsmash is not liable for any losses, missed winnings, or incorrect wagers made after using our tools. We are not responsible for your betting outcomes.

3. No Betting or Gambling Services
Oddsmash is not a sportsbook and does not accept or place bets on behalf of users. We do not offer real-money wagering or betting capabilities of any kind.

4. User Conduct
By using Oddsmash, you agree to only access our tools for personal, non-commercial use. You may not use our platform to scrape data or impersonate other users.

5. Data Collection
We collect user information such as email, name, and usage behavior to improve your experience. Please review our Privacy Policy for full details.

6. External Links
We provide outbound links to sportsbook websites for user convenience. We are not affiliated with these sportsbooks and make no guarantees regarding the accuracy, terms, or services provided by them.

7. Availability
Our tools are provided “as is.” We do our best to ensure high availability and accurate data, but we do not guarantee uninterrupted or error-free service.

8. Age Requirement
You must be at least 18 years old, or the legal betting age in your jurisdiction, to use Oddsmash. It is your responsibility to follow applicable laws.

9. Changes to Terms
We may update these Terms from time to time. Any significant updates will be communicated via email or on the site.

10. Governing Law
These Terms are governed by the laws of the United States and the state in which the company operates.

11. Contact
For questions or concerns, please email us at support@oddsmash.io.`}
        </pre>
      </div>
    </main>
  );
};

export default TOS;
