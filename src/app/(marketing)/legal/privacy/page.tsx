import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — CCowork.ai',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-textPrimary">Privacy Policy</h1>
      <p className="mt-2 text-sm text-textMuted">Last updated: February 25, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-textMuted">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">1. Information We Collect</h2>
          <p>
            When you create an account, we collect your name and email address through our
            authentication provider, Clerk. When you participate in coworking sessions, we process
            video and audio streams through Twilio. We do not store recordings of your sessions.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">2. How We Use Your Information</h2>
          <p>
            We use your information to provide the CCowork.ai service, including matching you with
            coworking partners, facilitating video sessions, and sending transactional emails related
            to your account and sessions. We use session metadata (duration, completion status) to
            improve the matching experience.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">3. Data Sharing</h2>
          <p>
            We do not sell your personal data. We share data only with the third-party services
            required to operate the platform: Clerk for authentication, Twilio for video
            infrastructure, and our database hosting provider. Your display name is visible to
            coworking partners during sessions.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">4. Data Retention</h2>
          <p>
            Account information is retained as long as your account is active. Session metadata
            (timestamps, duration, ratings) is retained for service improvement. Video streams are
            ephemeral and not recorded or stored by CCowork.ai. You may request deletion of your
            account and associated data at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">5. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management. We do not use
            advertising or third-party tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">6. Security</h2>
          <p>
            We use industry-standard encryption for data in transit (TLS) and at rest. Video
            sessions are transmitted over encrypted connections via Twilio. Authentication is
            managed by Clerk with support for multi-factor authentication.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">7. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data. You may export
            your data or request account deletion by contacting support@ccowork.ai.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">8. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of significant
            changes via email or an in-app notice. Continued use of the service after changes
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-textPrimary">9. Contact</h2>
          <p>
            For privacy-related questions, contact us at support@ccowork.ai.
          </p>
        </section>
      </div>
    </div>
  );
}
