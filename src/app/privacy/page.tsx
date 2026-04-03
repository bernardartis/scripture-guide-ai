// app/privacy/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — ScriptureGuide AI',
}

const EFFECTIVE_DATE = 'April 2, 2026'
const CONTACT_EMAIL  = 'privacy@digsbs.com'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">

        <div className="mb-10">
          <Link href="/" className="text-sm text-amber-700 hover:underline mb-4 block">
            ← Back to ScriptureGuide AI
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-8">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. Who we are</h2>
            <p className="text-gray-700">
              ScriptureGuide AI, Inc. ("we," "us," or "our") operates the ScriptureGuide AI
              Bible study service. We are the data controller for personal data collected through
              the Service. Contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber-700 underline">{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. What data we collect</h2>

            <h3 className="text-sm font-semibold text-gray-800 mb-2 mt-4">Account data</h3>
            <p className="text-gray-700 mb-3">
              Name, email address, password (hashed — never stored in plaintext), date of birth
              (used for age verification only, not retained after verification), and account creation date.
            </p>

            <h3 className="text-sm font-semibold text-gray-800 mb-2">Religious belief data (special category)</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
              <p className="text-amber-900 text-sm">
                <strong>Important:</strong> Denomination preference, experience level, and Bible chat
                history constitute religious belief data — a special category of personal data under
                GDPR Article 9 and sensitive personal information under California CPRA. We collect
                this data <strong>only with your explicit, separate consent</strong>. You may withdraw
                this consent at any time in Settings, and your religious data will be deleted within 30 days.
              </p>
            </div>

            <h3 className="text-sm font-semibold text-gray-800 mb-2">Usage data</h3>
            <p className="text-gray-700 mb-3">
              Chat sessions, Bible versions selected, features used, and session timestamps.
              IP addresses are one-way hashed (SHA-256) immediately on receipt — we never store
              raw IP addresses.
            </p>

            <h3 className="text-sm font-semibold text-gray-800 mb-2">Billing data</h3>
            <p className="text-gray-700">
              Subscription plan, billing status, and renewal dates. Payment card details are
              processed and stored by Stripe — we never see or store raw card numbers.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. Legal basis for processing (GDPR)</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li><strong>Contract performance:</strong> Account data and billing data processed to deliver the Service you signed up for.</li>
              <li><strong>Explicit consent (Article 9):</strong> Religious belief data (denomination, chat history) processed only with your separate, explicit consent.</li>
              <li><strong>Legal obligation:</strong> Consent records retained for 3 years to demonstrate GDPR compliance.</li>
              <li><strong>Legitimate interests:</strong> Anonymized analytics to improve the Service, fraud prevention.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. How we use your data</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Providing, personalizing, and improving the Bible study experience</li>
              <li>Processing subscription payments and sending billing notifications</li>
              <li>Sending transactional emails (welcome, subscription confirmation, renewal reminders)</li>
              <li>Detecting and preventing abuse of the Service</li>
              <li>Complying with legal obligations</li>
            </ul>
            <p className="text-gray-700 mt-3">
              We do <strong>not</strong> sell your personal data. We do not use your data to train
              AI models. We do not run advertising on the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. Data retention</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-2 border border-gray-200 font-medium text-gray-700">Data type</th>
                    <th className="text-left p-2 border border-gray-200 font-medium text-gray-700">Retention period</th>
                    <th className="text-left p-2 border border-gray-200 font-medium text-gray-700">Deletion method</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  {[
                    ['Chat messages', '90 days after last login', 'Hard delete'],
                    ['Account / denomination', 'Duration of account + 30 days', 'Hard delete on request'],
                    ['Analytics events', '24 months', 'Anonymized (user ID removed)'],
                    ['Consent records', '3 years (legal requirement)', 'Tombstone only — proof of consent'],
                    ['Billing / subscription events', '7 years (tax law)', 'Archived, not deleted'],
                    ['Minor user sessions (13–17)', 'Session only — not persisted', 'Auto-purged on session end'],
                  ].map(([type, period, method]) => (
                    <tr key={type}>
                      <td className="p-2 border border-gray-200">{type}</td>
                      <td className="p-2 border border-gray-200">{period}</td>
                      <td className="p-2 border border-gray-200">{method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. Third-party services (sub-processors)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-2 border border-gray-200 font-medium text-gray-700">Service</th>
                    <th className="text-left p-2 border border-gray-200 font-medium text-gray-700">Purpose</th>
                    <th className="text-left p-2 border border-gray-200 font-medium text-gray-700">Data shared</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  {[
                    ['Anthropic', 'AI responses', 'Chat messages (no PII after redaction)'],
                    ['Supabase / PostgreSQL', 'Database hosting', 'All user data'],
                    ['Stripe', 'Payment processing', 'Email, billing info'],
                    ['Resend', 'Transactional email', 'Name, email address'],
                    ['Vercel', 'App hosting', 'Request logs (IP hashed)'],
                    ['AO Lab / API.Bible', 'Bible content', 'No user data'],
                  ].map(([service, purpose, data]) => (
                    <tr key={service}>
                      <td className="p-2 border border-gray-200 font-medium">{service}</td>
                      <td className="p-2 border border-gray-200">{purpose}</td>
                      <td className="p-2 border border-gray-200">{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 text-xs mt-3">
              All sub-processors are bound by Data Processing Agreements. EU data transfers
              use Standard Contractual Clauses where required.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">7. Children's privacy (COPPA)</h2>
            <p className="text-gray-700">
              The Service is not directed to children under 13. We do not knowingly collect
              personal data from children under 13. If you believe a child under 13 has created
              an account, contact us at {CONTACT_EMAIL} and we will delete the account promptly.
            </p>
            <p className="text-gray-700 mt-3">
              For users aged 13–17, chat history is not retained beyond the current session.
              Parents or guardians may contact us to review or delete their minor child's data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">8. Your rights</h2>

            <h3 className="text-sm font-semibold text-gray-800 mb-2">All users</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 mb-4">
              <li><strong>Access:</strong> Download all your data from Settings → Download my data</li>
              <li><strong>Deletion:</strong> Delete your account from Settings → Delete my account</li>
              <li><strong>Correction:</strong> Update your profile at any time in Settings</li>
              <li><strong>Withdraw consent:</strong> Uncheck religious data consent in Settings at any time</li>
            </ul>

            <h3 className="text-sm font-semibold text-gray-800 mb-2">EU / EEA users (GDPR)</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 mb-4">
              <li>Right to data portability (JSON export via Settings)</li>
              <li>Right to object to processing based on legitimate interests</li>
              <li>Right to lodge a complaint with your national supervisory authority</li>
              <li>Right to not be subject to solely automated decision-making</li>
            </ul>

            <h3 className="text-sm font-semibold text-gray-800 mb-2">California users (CCPA / CPRA)</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>Right to know what personal information is collected</li>
              <li>Right to delete personal information</li>
              <li>Right to opt out of sale or sharing (we do not sell data)</li>
              <li>Right to non-discrimination for exercising privacy rights</li>
              <li>Denomination and chat history are "sensitive personal information" — collected only with separate opt-in consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">9. Data breach notification</h2>
            <p className="text-gray-700">
              In the event of a data breach affecting your personal data, we will notify you and,
              where required, supervisory authorities within 72 hours of becoming aware of the breach.
              Breaches involving religious belief data are treated as high severity and will result
              in direct user notification regardless of jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">10. Cookies</h2>
            <p className="text-gray-700">
              We use only essential cookies required for authentication and session management.
              We do not use advertising cookies, tracking pixels, or third-party analytics cookies.
              You cannot opt out of essential cookies without losing the ability to sign in.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">11. Changes to this policy</h2>
            <p className="text-gray-700">
              We will notify you of material changes to this Privacy Policy by email at least
              14 days before they take effect. Continued use of the Service after the effective
              date constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">12. Contact us</h2>
            <p className="text-gray-700">
              For privacy questions, data requests, or to exercise your rights:<br />
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber-700 underline">{CONTACT_EMAIL}</a>
            </p>
            <p className="text-gray-700 mt-2">
              We respond to all privacy requests within 30 days (45 days for California residents
              under CCPA). EU users may also contact our Data Protection Officer at the same address.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-xs text-gray-400 flex gap-4 flex-wrap">
          <Link href="/terms" className="hover:text-gray-600">Terms of Service</Link>
          <Link href="/copyright" className="hover:text-gray-600">Bible Copyrights</Link>
          <Link href="/chat" className="hover:text-gray-600">Back to app</Link>
        </div>
      </div>
    </div>
  )
}
