# Stripe Checkout Setup Guide

## Prerequisites
- Stripe account (sign up at https://stripe.com)
- Netlify account with your site deployed

## Step 1: Get Your Stripe API Keys

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com
2. Click on **Developers** in the left sidebar
3. Click on **API keys**
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_` for test mode)
   - **Secret key** (starts with `sk_test_` for test mode) - Click "Reveal test key"

## Step 2: Add Stripe Keys to Netlify Environment Variables

1. Go to your Netlify dashboard
2. Select your site (torptcg)
3. Go to **Site settings** → **Environment variables**
4. Add the following variables:
   - **Name**: `STRIPE_SECRET_KEY`
   - **Value**: Your Stripe secret key (sk_test_...)
   - Click **Add variable**

## Step 3: Install Stripe Package

The `create-checkout.js` function requires the Stripe npm package. Add it to your `package.json`:

```json
{
  "dependencies": {
    "stripe": "^14.0.0"
  }
}
```

Or run this command in your project directory:
```bash
npm install stripe
```

## Step 4: Test the Integration

### Testing Locally:

1. Make sure your environment variables are set in `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_your_key_here
   ```

2. Start your local dev server:
   ```bash
   netlify dev
   ```

3. Add items to cart and click "Proceed to Checkout"

4. Use Stripe test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date (e.g., 12/34)
   - Use any 3-digit CVC (e.g., 123)
   - Use any ZIP code (e.g., 12345)

### Testing on Netlify:

1. Deploy your site to Netlify
2. The environment variables you set in Step 2 will be used automatically
3. Test the checkout flow with test card numbers

## Step 5: Configure Stripe Webhook (Already Done!)

Your existing webhook at `netlify/functions/stripe-webhook.js` will handle:
- `checkout.session.completed` - Updates inventory when payment succeeds
- `payment_intent.succeeded` - Confirms payment

The webhook is already configured to update stock levels automatically.

## Step 6: Go Live (When Ready)

1. In Stripe Dashboard, toggle from **Test mode** to **Live mode** (top right)
2. Get your **live** API keys (they start with `pk_live_` and `sk_live_`)
3. Update the `STRIPE_SECRET_KEY` environment variable in Netlify with your live key
4. Redeploy your site

## Troubleshooting

### "Failed to create checkout session"
- Check that `STRIPE_SECRET_KEY` is set in Netlify environment variables
- Verify the key is correct (starts with `sk_test_` or `sk_live_`)
- Check Netlify function logs for errors

### Checkout redirects but shows error
- Verify your success URL is correct in `create-checkout.js`
- Check that `success.html` exists in your project root

### Stock not updating after purchase
- Verify webhook is receiving events in Stripe Dashboard → Developers → Webhooks
- Check webhook signing secret is correct
- Review Netlify function logs for webhook errors

## Current Flow

1. **User adds items to cart** → Stored in localStorage
2. **User clicks "Proceed to Checkout"** → Calls `create-checkout` function
3. **Function creates Stripe session** → Returns checkout URL
4. **User redirected to Stripe** → Enters payment details
5. **Payment succeeds** → Stripe sends webhook
6. **Webhook updates inventory** → Stock levels decreased
7. **User redirected to success page** → Cart cleared

## Features Included

✅ Stock validation before adding to cart
✅ Stock limit warnings with shake animation
✅ Secure Stripe Checkout
✅ Automatic inventory updates via webhook
✅ Success page with cart clearing
✅ Error handling and user feedback

## Next Steps

1. Set up your Stripe account
2. Add API keys to Netlify
3. Install Stripe package
4. Test with test cards
5. When ready, switch to live mode

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Test Cards: https://stripe.com/docs/testing
