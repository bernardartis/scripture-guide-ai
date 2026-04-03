# ScriptureGuide AI — First-run setup checklist
# Run through this once you have your external accounts ready.
# Every command below is copy-paste ready.

## Step 1 — Supabase (database)

1. Create a free project at https://supabase.com
2. Go to: Settings → Database → Connection pooling
3. Copy the "Transaction" connection string (port 6543)
4. Paste it into .env.local as DATABASE_URL

Then enable pgvector:
  Supabase Dashboard → Extensions → search "vector" → Enable

## Step 2 — Generate Prisma client and push schema

  npx prisma generate
  npx prisma db push

Verify it worked:
  npx prisma studio   ← opens a DB browser at localhost:5555

## Step 3 — Anthropic API key

1. Go to https://console.anthropic.com → API Keys → Create key
2. Paste into .env.local as ANTHROPIC_API_KEY

## Step 4 — Auth secret

  openssl rand -base64 32
  # Paste output into .env.local as AUTH_SECRET

## Step 5 — Stripe

1. Create account at https://dashboard.stripe.com
2. API Keys → copy Secret key → STRIPE_SECRET_KEY
3. API Keys → copy Publishable key → STRIPE_PUBLISHABLE_KEY

Create products:
  Products → Add product → "Believer Monthly" → $4.99/month recurring
    → Copy price ID → STRIPE_PRICE_BELIEVER_MONTHLY
  Products → Add product → "Believer Annual" → $47.88/year recurring
    → Copy price ID → STRIPE_PRICE_BELIEVER_ANNUAL
  Products → Add product → "Church Monthly" → $49/month recurring
    → Copy price ID → STRIPE_PRICE_CHURCH_MONTHLY

Webhook (local testing with Stripe CLI):
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  # Copy the webhook signing secret → STRIPE_WEBHOOK_SECRET

## Step 6 — Resend (email)

1. Create account at https://resend.com
2. API Keys → Create key → RESEND_API_KEY
3. Add and verify your sending domain
4. Set EMAIL_FROM="ScriptureGuide AI <noreply@yourdomain.com>"

## Step 7 — Run locally

  npm run dev
  # Visit http://localhost:3000

## Step 8 — Deploy to Vercel

  # Install Vercel CLI
  npm i -g vercel

  # Deploy (first time — follow prompts)
  vercel

  # Add all .env.local variables to Vercel:
  # Dashboard → Project → Settings → Environment Variables

  # Production webhook URL for Stripe:
  # https://yourdomain.vercel.app/api/webhooks/stripe

## Troubleshooting

"Cannot resolve .prisma/client/default"
  → Run: npx prisma generate
  → This needs DATABASE_URL to be set first

"P1001: Can't reach database server"
  → Check DATABASE_URL uses Transaction pooler (port 6543), not Direct (port 5432)
  → Supabase free tier pauses after 1 week of inactivity — resume it in dashboard

"Invalid API key" from Anthropic
  → Check ANTHROPIC_API_KEY starts with "sk-ant-"
  → Key must have Messages API access enabled

Stripe webhook signature mismatch
  → In development, use: stripe listen --forward-to localhost:3000/api/webhooks/stripe
  → Copy the whsec_... secret it prints → STRIPE_WEBHOOK_SECRET
  → In production, use the secret from Stripe Dashboard → Webhooks
