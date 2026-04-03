// lib/email/index.ts
// Transactional emails via Resend.
// All emails use plain, accessible HTML — no heavy templates.

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.EMAIL_FROM ?? 'ScriptureGuide AI <noreply@digsbs.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://digsbs.com'

// ─── WELCOME EMAIL ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from:    FROM,
    to,
    subject: 'Welcome to ScriptureGuide AI',
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Georgia,serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">

    <!-- Header -->
    <div style="background:#7c2d12;padding:32px 32px 24px;">
      <p style="color:#fde68a;font-size:13px;margin:0 0 4px;letter-spacing:0.05em;text-transform:uppercase;">ScriptureGuide AI</p>
      <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:normal;line-height:1.4;">Welcome, ${name}</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 20px;">
        Your account is ready. You can now explore Scripture with AI-powered guidance — finding answers to your Bible questions, understanding original Greek and Hebrew meanings, and discovering what the Word says about the moments in your life.
      </p>

      <!-- Verse of the day -->
      <div style="background:#fffbeb;border-left:4px solid #d97706;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px;">
        <p style="color:#92400e;font-size:11px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.06em;">To get you started</p>
        <p style="color:#1f2937;font-size:15px;font-style:italic;line-height:1.6;margin:0 0 8px;">
          "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."
        </p>
        <p style="color:#6b7280;font-size:13px;margin:0;">— Jeremiah 29:11 (KJV)</p>
      </div>

      <a href="${APP_URL}/chat"
         style="display:inline-block;background:#b45309;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">
        Open ScriptureGuide AI
      </a>

      <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:28px 0 0;">
        ScriptureGuide AI is a Bible reference tool, not a counseling service.
        For mental health emergencies, please call or text <strong>988</strong>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;">
      <p style="color:#9ca3af;font-size:11px;margin:0;">
        ScriptureGuide AI · <a href="${APP_URL}/unsubscribe" style="color:#9ca3af;">Unsubscribe</a> ·
        <a href="${APP_URL}/copyright" style="color:#9ca3af;">Bible copyrights</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  })
}

// ─── SUBSCRIPTION CONFIRMATION ────────────────────────────────────────────────

export async function sendSubscriptionConfirmation(
  to: string,
  name: string,
  planName: string,
  renewalDate: string,
  monthlyPrice: string
) {
  return resend.emails.send({
    from:    FROM,
    to,
    subject: `Your ${planName} subscription is active — ScriptureGuide AI`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Georgia,serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">

    <div style="background:#7c2d12;padding:32px 32px 24px;">
      <p style="color:#fde68a;font-size:13px;margin:0 0 4px;">ScriptureGuide AI</p>
      <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:normal;">Your subscription is active</h1>
    </div>

    <div style="padding:32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 24px;">
        Hi ${name}, your <strong>${planName}</strong> plan is now active. Thank you for supporting ScriptureGuide AI.
      </p>

      <!-- Subscription details box -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 24px;">
        <table style="width:100%;font-size:14px;color:#374151;">
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Plan</td>
            <td style="padding:6px 0;text-align:right;font-weight:500;">${planName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Amount</td>
            <td style="padding:6px 0;text-align:right;">${monthlyPrice}/month</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Next renewal</td>
            <td style="padding:6px 0;text-align:right;">${renewalDate}</td>
          </tr>
        </table>
      </div>

      <!-- FTC required disclosure -->
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 20px;background:#f9fafb;border-radius:8px;padding:14px;">
        Your subscription renews automatically on ${renewalDate}. To cancel, go to
        <a href="${APP_URL}/billing" style="color:#b45309;">ScriptureGuide AI → Billing → Manage subscription</a>.
        Cancellation takes effect at the end of your current billing period.
      </p>

      <a href="${APP_URL}/chat"
         style="display:inline-block;background:#b45309;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;">
        Start exploring
      </a>
    </div>

    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;">
      <p style="color:#9ca3af;font-size:11px;margin:0;">
        ScriptureGuide AI · <a href="${APP_URL}/billing" style="color:#9ca3af;">Manage subscription</a> ·
        <a href="${APP_URL}/copyright" style="color:#9ca3af;">Bible copyrights</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  })
}

// ─── ANNUAL RENEWAL REMINDER (CA + MN legal requirement) ─────────────────────

export async function sendAnnualRenewalReminder(
  to: string,
  name: string,
  renewalDate: string,
  amount: string
) {
  return resend.emails.send({
    from:    FROM,
    to,
    subject: `Your ScriptureGuide AI annual subscription renews on ${renewalDate}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Georgia,serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;">
    <p style="color:#92400e;font-size:13px;margin:0 0 8px;">ScriptureGuide AI</p>
    <h1 style="font-size:20px;color:#1f2937;margin:0 0 20px;font-weight:normal;">Subscription renewal reminder</h1>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Hi ${name}, your annual ScriptureGuide AI subscription will automatically renew on
      <strong>${renewalDate}</strong> for <strong>${amount}</strong>.
    </p>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
      If you'd like to cancel before the renewal date, you can do so from your billing page.
      No refunds are available after the renewal date.
    </p>
    <div style="display:flex;gap:12px;">
      <a href="${APP_URL}/billing"
         style="display:inline-block;background:#b45309;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;margin-right:12px;">
        Manage subscription
      </a>
      <a href="${APP_URL}/chat"
         style="display:inline-block;border:1px solid #d1d5db;color:#374151;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;">
        Continue studying
      </a>
    </div>
    <p style="color:#9ca3af;font-size:11px;margin:28px 0 0;">
      This reminder is required by California and Minnesota auto-renewal laws.
    </p>
  </div>
</body>
</html>`,
  })
}
