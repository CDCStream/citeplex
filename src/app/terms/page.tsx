import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Citeplex",
  description: "Read the terms and conditions for using Citeplex.",
};

export default function TermsPage() {
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
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: March 15, 2026
      </p>

      <div className="prose prose-neutral dark:prose-invert mt-10 max-w-none space-y-8 text-[15px] leading-relaxed">
        <section>
          <h2 className="text-xl font-bold">1. Acceptance of Terms</h2>
          <p>
            By using Citeplex, you agree to these terms. If you do not agree,
            please do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">2. What Citeplex Does</h2>
          <p>
            Citeplex tracks how 7 AI engines (ChatGPT, Perplexity, Gemini, Claude,
            DeepSeek, Grok, and Mistral) talk about your brand. We run daily scans,
            show scores, and compare you with competitors.
          </p>
          <p className="mt-3">
            We may add, change, or remove features at any time. For example, if an
            AI provider shuts down its API, we may drop that engine. We will try to
            let you know about big changes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">3. Your Account</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Give us correct info when you sign up</li>
            <li>Keep your password safe</li>
            <li>You must be at least 18 years old</li>
            <li>One account per person — do not share accounts</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold">4. Plans and Pricing</h2>
          <p>Citeplex offers the following plans:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li><strong>Free:</strong> 3 prompts, daily scans, 7 AI engines — $0/month</li>
            <li><strong>Starter:</strong> 15 prompts — $20/month</li>
            <li><strong>Growth:</strong> 30 prompts — $39/month</li>
            <li><strong>Pro:</strong> 50 prompts — $59/month</li>
            <li><strong>Business:</strong> 100 prompts — $99/month</li>
            <li><strong>Enterprise:</strong> 250 prompts — $249/month</li>
          </ul>
          <p>
            All paid plans are billed monthly. Prices are in USD and may be updated with
            30 days&apos; notice.
          </p>
          <p className="mt-3">
            Need more than 250 prompts? We can set up a custom deal. Contact{" "}
            <a href="mailto:enterprise@citeplex.io" className="text-primary hover:underline">
              enterprise@citeplex.io
            </a>{" "}
            for details.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">5. Payment and Billing</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>We use Polar.sh to handle payments</li>
            <li>Plans renew each month unless you cancel</li>
            <li>You can cancel at any time from your billing page</li>
            <li>No refunds for partial months — you keep access until the period ends</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold">6. Rules &amp; Fair Use</h2>
          <p>Please do not:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Use Citeplex for anything illegal</li>
            <li>Try to hack or break into our systems</li>
            <li>Copy, reverse-engineer, or take apart our code</li>
            <li>Use bots or scripts to scrape data</li>
            <li>Resell our service without permission</li>
            <li>Send harmful or fake content</li>
            <li>Overload our servers with rapid-fire requests</li>
          </ul>
          <p className="mt-3">
            <strong>Fair Use:</strong> All plans have fair use limits. If your account
            puts too much load on our systems, we may slow it down or pause it. We
            will try to reach out to you first.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">7. Who Owns What</h2>
          <p>
            We own the Citeplex design, code, and brand. You own the data you put
            into Citeplex. We do not claim rights over your data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">8. Data and Privacy</h2>
          <p>
            Our{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            {" "}explains how we handle your data. By using Citeplex, you agree to it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">9. Uptime</h2>
          <p>
            We aim for high uptime but cannot promise it will never go down. AI
            engines run on third-party APIs. If they have issues, our scans may
            be affected. We are not responsible for third-party outages.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">10. Limits on Our Liability</h2>
          <p>
            We are not liable for indirect or special damages from using Citeplex.
            The most we owe you is the amount you paid us in the last 12 months.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">11. Closing Your Account</h2>
          <p>
            We can suspend or close your account if you break these rules. You can
            also delete your account at any time. We handle your data as described
            in our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">12. Changes to Terms</h2>
          <p>
            We may update these terms. If we make big changes, we will email you or
            post a notice at least 30 days before. If you keep using Citeplex after
            that, you accept the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">13. Governing Law</h2>
          <p>
            These terms follow the laws of the Republic of T&uuml;rkiye. Any legal
            disputes will be handled by the courts of Istanbul, T&uuml;rkiye.
          </p>
          <p className="mt-3">
            If one part of these terms is found invalid, the rest still apply.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">14. Contact</h2>
          <p>
            For questions about these Terms, contact us at:{" "}
            <a href="mailto:legal@citeplex.io" className="text-primary hover:underline">
              legal@citeplex.io
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
