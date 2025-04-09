import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

// CHATGPT PROMPT TO GENERATE YOUR PRIVACY POLICY — replace with your own data 👇

// 1. Go to https://chat.openai.com/
// 2. Copy paste bellow
// 3. Replace the data with your own (if needed)
// 4. Paste the answer from ChatGPT directly in the <pre> tag below

// You are an excellent lawyer.

// I need your help to write a simple privacy policy for my website. Here is some context:
// - Website: https://shipfa.st
// - Name: ShipFast
// - Description: A JavaScript code boilerplate to help entrepreneurs launch their startups faster
// - User data collected: name, email and payment information
// - Non-personal data collection: web cookies
// - Purpose of Data Collection: Order processing
// - Data sharing: we do not share the data with any other parties
// - Children's Privacy: we do not collect any data from children
// - Updates to the Privacy Policy: users will be updated by email
// - Contact information: marc@shipfa.st

// Please write a simple privacy policy for my site. Add the current date.  Do not add or explain your reasoning. Answer:

export const metadata = getSEOTags({
  title: `Privacy Policy | ${config.appName}`,
  canonicalUrlRelative: "/privacy-policy",
});

const PrivacyPolicy = () => {
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
          </svg>{" "}
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Privacy Policy for {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Privacy Policy
Effective Date: April 8, 2025

Thank you for using Oddsmash. This Privacy Policy outlines how we collect, use, and protect your information.

1. Information We Collect
We do not collect personal information such as names, passwords, or payment details. The only personal data we collect is your email address, and only if you voluntarily provide it by signing up for our newsletter.

We also collect non-personal data through web cookies to help us analyze website usage and improve user experience.

2. Purpose of Data Collection
We collect and use your email address (if provided) to:

Send product updates, betting insights, and newsletters

Notify you about new tools or features

We use cookies to:

Improve site performance

Understand how visitors interact with the platform

3. Data Sharing
We do not sell, rent, or share your personal information with any third parties. Your data is used solely to improve your experience with Oddsmash.

4. Age Requirement
Oddsmash is intended for users 18 years of age or older. By using the site, you confirm that you meet this age requirement.

5. Children's Privacy
We do not knowingly collect or store data from children under the age of 13. If you believe a child has submitted data to us, please contact us immediately.

6. Data Security
We implement appropriate measures to safeguard your information. While no method is entirely secure, we are committed to keeping your data protected.

7. Policy Updates
We may update this Privacy Policy from time to time. If changes are significant, we’ll notify you via the site or email (if subscribed).

8. Contact
For questions or concerns, please contact us at: support@oddsmash.io`}
        </pre>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
