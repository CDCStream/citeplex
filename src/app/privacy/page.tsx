import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Citeplex",
  description: "Learn how Citeplex collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: March 15, 2026
      </p>

      <div className="prose prose-neutral dark:prose-invert mt-10 max-w-none space-y-8 text-[15px] leading-relaxed">
        <section>
          <h2 className="text-xl font-bold">1. Introduction</h2>
          <p>
            Citeplex (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) runs the citeplex.io
            website. This page explains what data we collect, how we use it, and how
            we keep it safe.
          </p>
          <p>
            We follow the GDPR, CCPA, and other data protection laws to protect
            your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">2. Information We Collect</h2>
          <h3 className="text-lg font-semibold">2.1 Information You Provide</h3>
          <ul className="list-disc space-y-1 pl-6">
            <li>Account information: name, email address, password</li>
            <li>Domain and brand information you submit for tracking</li>
            <li>Payment information processed through our payment provider (Polar.sh)</li>
            <li>Communications you send to us</li>
          </ul>

          <h3 className="mt-4 text-lg font-semibold">2.2 Automatically Collected Information</h3>
          <ul className="list-disc space-y-1 pl-6">
            <li>Usage data: pages visited, features used, timestamps</li>
            <li>Device data: browser type, operating system, IP address</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold">3. How We Use Your Information</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>To run our AI visibility tracking service</li>
            <li>To handle your payments</li>
            <li>To send you emails (welcome, password reset, billing)</li>
            <li>To make our platform better</li>
            <li>To follow the law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold">4. Legal Basis (GDPR)</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li><strong>Contract:</strong> We need your data to give you the service you signed up for</li>
            <li><strong>Our interest:</strong> We use data to improve our product and stop fraud</li>
            <li><strong>Your consent:</strong> We ask before using analytics or marketing cookies</li>
            <li><strong>Law:</strong> Sometimes the law requires us to keep certain data</li>
          </ul>
        </section>

        <section id="cookies">
          <h2 className="text-xl font-bold">5. Cookies</h2>
          <p>We use the following types of cookies:</p>

          <h3 className="mt-4 text-lg font-semibold">5.1 Essential Cookies (Always Active)</h3>
          <p>These cookies are strictly necessary for the platform to function and cannot be disabled.</p>
          <div className="mt-2 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Cookie</th>
                  <th className="px-4 py-2 text-left font-medium">Purpose</th>
                  <th className="px-4 py-2 text-left font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">sb-*-auth-token</td>
                  <td className="px-4 py-2">Supabase authentication session</td>
                  <td className="px-4 py-2">1 year</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">citeplex_cookie_consent</td>
                  <td className="px-4 py-2">Stores your cookie preference</td>
                  <td className="px-4 py-2">Persistent</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="mt-4 text-lg font-semibold">5.2 Analytics</h3>
          <p>
            <strong>Google Analytics 4</strong> only loads if you click &quot;Accept
            All&quot; on the cookie banner. <strong>Ahrefs Web Analytics</strong> runs
            on our pages for traffic data. It may set cookies as described in{" "}
            <a
              href="https://ahrefs.com/privacy-policy"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ahrefs&apos; policy
            </a>
            .
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Cookie</th>
                  <th className="px-4 py-2 text-left font-medium">Purpose</th>
                  <th className="px-4 py-2 text-left font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">_ga, _ga_*</td>
                  <td className="px-4 py-2">Google Analytics 4</td>
                  <td className="px-4 py-2">2 years</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">Ahrefs (script)</td>
                  <td className="px-4 py-2">Ahrefs Web Analytics (analytics.ahrefs.com)</td>
                  <td className="px-4 py-2">Per Ahrefs policy</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="mt-4 text-lg font-semibold">5.3 Managing Cookies</h3>
          <p>
            You can change your cookie preferences at any time by clicking the
            &quot;Cookie Settings&quot; link in the website footer, which will re-display
            the consent banner. You can also manage cookies through your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">6. Data Sharing</h2>
          <p>We do not sell your personal data. We may share data with:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li><strong>Supabase:</strong> Database and authentication hosting</li>
            <li><strong>Polar.sh:</strong> Payment processing</li>
            <li><strong>Resend:</strong> Transactional email delivery</li>
            <li><strong>Vercel:</strong> Application hosting</li>
            <li><strong>AI Providers:</strong> To perform visibility scans (no personal data is shared with AI engines)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold">7. Data Transfers</h2>
          <p>
            Some of our tools (Supabase, Vercel, Polar.sh, Resend) are based in the US.
            When data leaves the EU, we protect it with:
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Standard Contractual Clauses (SCCs)</strong> approved by the EU
            </li>
            <li>
              Providers with <strong>SOC 2</strong> security certifications
            </li>
            <li>
              Data processing agreements with all our partners
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold">8. Data Retention</h2>
          <p>
            We keep your data while your account is active. If you delete your account,
            we remove your data within 30 days, unless the law says we must keep it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">9. Your Rights</h2>
          <p>Under GDPR and applicable laws, you have the right to:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Access your personal data</li>
            <li>Rectify inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Restrict or object to processing</li>
            <li>Data portability</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p>
            To exercise these rights, contact us at{" "}
            <a href="mailto:privacy@citeplex.io" className="text-primary hover:underline">
              privacy@citeplex.io
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">10. Children&apos;s Privacy</h2>
          <p>
            Citeplex is not for anyone under 16. We do not collect data from children.
            If you think a child shared data with us, please contact us at{" "}
            <a href="mailto:privacy@citeplex.io" className="text-primary hover:underline">
              privacy@citeplex.io
            </a>
            {" "}and we will delete it right away.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">11. Security</h2>
          <p>
            We use encryption (TLS), secure login via Supabase Auth, and regular
            security checks to keep your data safe.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">12. Changes to This Policy</h2>
          <p>
            We may update this page. If we make big changes, we will let you know
            by email or a notice on our site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">13. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, contact us at:{" "}
            <a href="mailto:privacy@citeplex.io" className="text-primary hover:underline">
              privacy@citeplex.io
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
