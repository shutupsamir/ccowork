import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — CCowork.ai',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-textPrimary">Terms of Service</h1>
      <p className="mt-2 text-sm text-textMuted">Last updated: February 25, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-textMuted">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">1. Acceptance of Terms</h2>
          <p>
            By accessing or using CCowork.ai, you agree to be bound by these Terms of Service. If
            you do not agree, do not use the service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">2. Description of Service</h2>
          <p>
            CCowork.ai provides instant coworking video sessions that pair users for focused work
            periods. The service includes user matching, video conferencing, and session timing
            features.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">3. User Accounts</h2>
          <p>
            You must create an account to use CCowork.ai. You are responsible for maintaining the
            security of your account credentials. You must provide accurate information during
            registration and keep it up to date.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">4. Acceptable Use</h2>
          <p>
            You agree to use CCowork.ai only for its intended purpose: focused coworking sessions.
            You may not use the service to harass, abuse, or intimidate other users. You may not
            share inappropriate, offensive, or illegal content during sessions. You may not attempt
            to disrupt, overload, or interfere with the service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">5. Session Conduct</h2>
          <p>
            Coworking sessions are intended for productive work. You are expected to show up for
            sessions you have matched for. Repeated no-shows may result in temporary or permanent
            suspension. You may block users you do not wish to be matched with.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">6. Intellectual Property</h2>
          <p>
            CCowork.ai and its original content, features, and functionality are owned by
            CCowork.ai and are protected by applicable intellectual property laws. You retain
            ownership of any work you produce during sessions.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">7. Limitation of Liability</h2>
          <p>
            CCowork.ai is provided &quot;as is&quot; without warranties of any kind. We are not
            liable for any indirect, incidental, or consequential damages arising from your use of
            the service. Our total liability shall not exceed the amount you have paid us in the
            twelve months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">8. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account at our discretion for
            violation of these terms. You may delete your account at any time. Upon termination,
            your right to use the service ceases immediately.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">9. Changes to Terms</h2>
          <p>
            We may modify these terms at any time. Material changes will be communicated via email
            or in-app notification. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">10. Contact</h2>
          <p>
            For questions about these terms, contact us at support@ccowork.ai.
          </p>
        </section>
      </div>
    </div>
  );
}
