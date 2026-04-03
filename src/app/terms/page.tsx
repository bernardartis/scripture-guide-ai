// app/terms/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — ScriptureGuide AI',
}

const EFFECTIVE_DATE = 'April 2, 2026'
const CONTACT_EMAIL  = 'legal@digsbs.com'
const APP_URL        = 'https://digsbs.com'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-sm text-amber-700 hover:underline mb-4 block">
            ← Back to ScriptureGuide AI
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-8">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. Agreement to terms</h2>
            <p className="text-gray-700">
              By creating an account or using ScriptureGuide AI ("the Service"), you agree to these
              Terms of Service. If you do not agree, do not use the Service. These Terms constitute
              a binding legal agreement between you and ScriptureGuide AI, Inc. ("we," "us," or "our"),
              a Texas limited liability company.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. Description of service</h2>
            <p className="text-gray-700 mb-3">
              ScriptureGuide AI is an AI-powered Bible study and Scripture reference tool.
              It is designed to help users explore biblical text, understand original language
              meanings, and find Scripture relevant to their questions.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-900 font-medium text-sm mb-1">Important limitation</p>
              <p className="text-amber-800 text-sm">
                ScriptureGuide AI is <strong>not</strong> a licensed pastor, ordained minister,
                counselor, therapist, psychologist, psychiatrist, medical doctor, or legal advisor.
                No pastoral, counseling, medical, or legal relationship is created by your use of
                this Service. For mental health emergencies, call or text <strong>988</strong>.
                For medical emergencies, call <strong>911</strong>.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. Eligibility and age requirements</h2>
            <p className="text-gray-700 mb-2">
              You must be at least <strong>13 years old</strong> to use the Service. By creating an
              account, you represent that you meet this age requirement.
            </p>
            <p className="text-gray-700">
              If you are between 13 and 17 years old, you represent that your parent or guardian
              has reviewed and agreed to these Terms on your behalf. Parents and guardians of minor
              users assume all risks and liabilities associated with the minor's use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. Subscriptions and billing</h2>
            <p className="text-gray-700 mb-3">
              The Service offers a free tier and paid subscription plans. By subscribing to a paid plan:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>You authorize us to charge your payment method on a recurring basis at the frequency and price shown at checkout.</li>
              <li>Subscriptions renew automatically unless cancelled before the renewal date.</li>
              <li>You may cancel at any time from <strong>Settings → Billing → Manage subscription</strong>. Cancellation takes effect at the end of the current billing period.</li>
              <li>We will notify you of any price changes at least 7 days before they take effect. You may cancel penalty-free if you do not accept the new price.</li>
              <li>Annual subscribers will receive a renewal reminder at least 14 days before renewal.</li>
              <li>Subscription fees are non-refundable except as required by applicable law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. Acceptable use</h2>
            <p className="text-gray-700 mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Attempt to circumvent, disable, or interfere with the AI safety guardrails built into the Service</li>
              <li>Use the Service to generate content that is abusive, threatening, or harassing</li>
              <li>Attempt to extract, scrape, or bulk-download Bible translation content in violation of applicable copyright licenses</li>
              <li>Misrepresent AI-generated responses as coming from a licensed pastor, counselor, or other credentialed professional</li>
              <li>Use the Service for any purpose that is illegal under applicable law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. Bible content and copyright</h2>
            <p className="text-gray-700">
              Bible translations displayed in the Service are either in the public domain or used
              under license from the respective copyright holders. See our{' '}
              <Link href="/copyright" className="text-amber-700 underline">Bible translation copyrights page</Link>{' '}
              for full attribution. You may not reproduce, redistribute, or bulk-download Bible
              translation text beyond personal study use.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">7. AI-generated content</h2>
            <p className="text-gray-700 mb-3">
              Responses generated by the Service are produced by an AI system and may contain errors,
              misinterpretations, or incomplete information. Always verify Scripture references
              independently. The Service is a study aid — it does not replace pastoral guidance,
              theological training, or personal study of the Bible.
            </p>
            <p className="text-gray-700">
              We do not warrant the theological accuracy, denominational correctness, or completeness
              of any AI-generated response.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">8. Disclaimer of warranties</h2>
            <p className="text-gray-700 uppercase text-xs leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, THEOLOGICAL ACCURACY, PASTORAL
              SUITABILITY, OR UNINTERRUPTED SERVICE. WE DO NOT WARRANT THAT THE SERVICE WILL BE
              ERROR-FREE OR THAT DEFECTS WILL BE CORRECTED.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">9. Limitation of liability</h2>
            <p className="text-gray-700 uppercase text-xs leading-relaxed mb-3">
              TO THE FULLEST EXTENT PERMITTED BY LAW, SCRIPTUREGUIDE AI, INC. SHALL NOT BE LIABLE
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING
              BUT NOT LIMITED TO LOSS OF DATA, LOSS OF PROFITS, OR PERSONAL HARM ARISING FROM YOUR
              USE OF THE SERVICE.
            </p>
            <p className="text-gray-700 text-xs">
              OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM THESE TERMS OR YOUR USE OF THE
              SERVICE SHALL NOT EXCEED THE TOTAL AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING
              THE CLAIM, OR $50, WHICHEVER IS GREATER.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">10. DMCA / copyright complaints</h2>
            <p className="text-gray-700">
              If you believe content on the Service infringes your copyright, please send a DMCA
              takedown notice to <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber-700 underline">{CONTACT_EMAIL}</a>.
              Include: identification of the copyrighted work, identification of the infringing material
              and its URL, your contact information, and a statement of good faith belief that the
              use is not authorized.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">11. Dispute resolution</h2>
            <p className="text-gray-700 mb-3">
              Any dispute arising from these Terms shall be resolved by binding individual arbitration
              under the rules of the American Arbitration Association, conducted in Dallas County, Texas.
              You waive the right to participate in a class action lawsuit or class-wide arbitration.
            </p>
            <p className="text-gray-700 text-xs">
              <strong>Opt-out:</strong> You may opt out of this arbitration agreement within 30 days
              of creating your account by emailing {CONTACT_EMAIL} with subject "Arbitration Opt-Out."
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">12. Governing law</h2>
            <p className="text-gray-700">
              These Terms are governed by the laws of the State of Texas, without regard to conflict
              of law principles. Any legal proceedings not subject to arbitration shall be brought
              exclusively in the courts of Dallas County, Texas.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">13. Changes to these terms</h2>
            <p className="text-gray-700">
              We may update these Terms from time to time. We will notify you of material changes
              by email and by requiring re-acceptance within the Service before you may continue
              using it. Continued use after re-acceptance constitutes agreement to the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">14. Contact</h2>
            <p className="text-gray-700">
              ScriptureGuide AI, Inc.<br />
              McKinney, Texas<br />
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber-700 underline">{CONTACT_EMAIL}</a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-xs text-gray-400 flex gap-4 flex-wrap">
          <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
          <Link href="/copyright" className="hover:text-gray-600">Bible Copyrights</Link>
          <Link href="/chat" className="hover:text-gray-600">Back to app</Link>
        </div>
      </div>
    </div>
  )
}
