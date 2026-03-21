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
            By accessing or using Citeplex (&quot;the Service&quot;), you agree to be bound
            by these Terms of Service. If you do not agree to these terms, please do not
            use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">2. Description of Service</h2>
          <p>
            Citeplex is an AI search visibility tracking platform that monitors your
            brand&apos;s presence across 7 AI search engines (ChatGPT, Perplexity, Gemini,
            Claude, DeepSeek, Grok, and Mistral). The Service provides daily scans,
            visibility scores, competitor comparisons, and actionable insights.
          </p>
          <p className="mt-3">
            Citeplex reserves the right to modify, add, or remove features and supported
            AI engines at any time without prior notice — for example, if a third-party
            AI provider discontinues its API or changes its terms of service. We will make
            reasonable efforts to notify users of significant changes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">3. Account Registration</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>You must provide accurate and complete registration information</li>
            <li>You are responsible for maintaining the security of your account credentials</li>
            <li>You must be at least 18 years old to create an account</li>
            <li>One person or entity per account; sharing accounts is not permitted</li>
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
            For Enterprise customers or organizations requiring more than 250 prompts,
            custom agreements may be arranged. Custom agreements supersede these Terms
            where applicable. Contact{" "}
            <a href="mailto:enterprise@citeplex.io" className="text-primary hover:underline">
              enterprise@citeplex.io
            </a>{" "}
            for details.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">5. Payment and Billing</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Payments are processed securely through Polar.sh</li>
            <li>Subscriptions auto-renew monthly unless cancelled</li>
            <li>You can cancel your subscription at any time from your billing settings</li>
            <li>No refunds for partial months; service continues until the end of the billing period</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold">6. Acceptable Use &amp; Fair Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
            <li>Use automated tools, bots, or scripts to scrape, extract data, or
                interact with the Service beyond normal human usage</li>
            <li>Resell or redistribute the Service without authorization</li>
            <li>Submit malicious or misleading content</li>
            <li>Generate excessive load on our infrastructure through automated or
                rapid-fire queries that exceed reasonable usage patterns</li>
          </ul>
          <p className="mt-3">
            <strong>Fair Use Policy:</strong> All plans are subject to fair use. We reserve
            the right to throttle or suspend accounts that place disproportionate load on
            our systems, such as using automated tools to consume prompt allocations in
            bulk within short timeframes. We will attempt to contact you before taking
            action.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">7. Intellectual Property</h2>
          <p>
            All content, features, and functionality of Citeplex — including the design,
            code, algorithms, and branding — are owned by Citeplex and protected by
            intellectual property laws. You retain ownership of the data you submit to the
            Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">8. Data and Privacy</h2>
          <p>
            Your use of the Service is also governed by our{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            . By using the Service, you consent to the collection and use of your data
            as described therein.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">9. Service Availability</h2>
          <p>
            We strive for high availability but do not guarantee uninterrupted access.
            AI engine responses depend on third-party APIs (OpenAI, Google, Anthropic,
            etc.) and may vary. We are not liable for third-party service outages or
            changes in AI engine behavior.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Citeplex shall not be liable for any
            indirect, incidental, special, or consequential damages arising from your use
            of the Service. Our total liability shall not exceed the amount you paid us in
            the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">11. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account if you violate these
            terms. You may delete your account at any time. Upon termination, your data
            will be handled in accordance with our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">12. Changes to Terms</h2>
          <p>
            We may modify these terms at any time. We will notify you of material changes
            by email or through a notice on our platform at least 30 days before they take
            effect. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">13. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of
            the Republic of T&uuml;rkiye. Any disputes arising from or relating to these
            Terms shall be subject to the exclusive jurisdiction of the courts of Istanbul,
            T&uuml;rkiye.
          </p>
          <p className="mt-3">
            If any provision of these Terms is found to be unenforceable, the remaining
            provisions shall continue in full force and effect.
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
