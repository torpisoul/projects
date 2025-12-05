# Troubleshooting Stock Updates After Purchase

## Issue
Stock levels aren't decreasing after purchase completion.

## Possible Causes

### 1. Webhook Not Configured in Stripe

The webhook needs to be set up in your Stripe Dashboard to send events to your Netlify function.

**To check/fix:**

1. Go to https://dashboard.stripe.com/test/webhooks
2. Check if there's a webhook endpoint configured
3. If not, click **"Add endpoint"**
4. Enter your webhook URL:
   - **Local testing**: Use Stripe CLI (see below)
   - **Production**: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
5. Select events to listen for:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
6. Click **"Add endpoint"**

### 2. Testing Locally - Stripe CLI Required

For local testing, you need the Stripe CLI to forward webhooks:

**Install Stripe CLI:**
```bash
# Windows (using Scoop)
scoop install stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

**Forward webhooks to local:**
```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

This will give you a webhook signing secret starting with `whsec_...`

**Add to your .env:**
```
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### 3. Webhook Signature Verification

The webhook might be rejecting events due to signature verification.

**Quick fix for testing** (NOT for production):

Update `netlify/functions/stripe-webhook.js` to temporarily skip verification:

```javascript
// At the top of the file, add:
const SKIP_VERIFICATION = process.env.SKIP_WEBHOOK_VERIFICATION === 'true';

// In the handler, before parsing:
if (!SKIP_VERIFICATION) {
    // Verify webhook signature here
}
```

Add to `.env`:
```
SKIP_WEBHOOK_VERIFICATION=true
```

### 4. Check Netlify Function Logs

When you complete a test purchase:

1. Watch your terminal running `netlify dev`
2. You should see:
   ```
   [STRIPE-WEBHOOK] Function invoked
   [STRIPE-WEBHOOK] Event type: checkout.session.completed
   [STRIPE-WEBHOOK] Processing 2 items
   ```

If you DON'T see these logs, the webhook isn't being called.

### 5. Inventory Function Issues

The webhook calls the inventory function. Check if that's working:

**Test manually:**
```bash
curl -X POST http://localhost:8888/.netlify/functions/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "test-product-id",
    "stock": 5,
    "action": "set",
    "binId": "your-bin-id",
    "category": "singles"
  }'
```

Should return: `{"success":true,"message":"Stock updated"}`

## Quick Diagnostic Steps

### Step 1: Check if webhook is being called

Add this at the very top of `stripe-webhook.js` handler:

```javascript
console.log('🔔 WEBHOOK CALLED!', new Date().toISOString());
console.log('📦 Event body:', event.body);
```

### Step 2: Complete a test purchase

1. Add items to cart
2. Checkout with test card: `4242 4242 4242 4242`
3. Watch terminal

**If you see "🔔 WEBHOOK CALLED!":**
- Webhook is working, check the cart_items parsing

**If you DON'T see it:**
- Webhook not configured or not reaching your function

### Step 3: Check Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/payments
2. Find your test payment
3. Click on it
4. Scroll to "Events and logs"
5. Check if `checkout.session.completed` was sent
6. Check if webhook delivery succeeded or failed

## Most Likely Issue: Local Webhook Testing

**For local development, you MUST use Stripe CLI:**

```bash
# Terminal 1: Run your dev server
netlify dev

# Terminal 2: Forward Stripe webhooks
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

The Stripe CLI will show you webhook events in real-time.

## Production Setup

For your deployed site:

1. **Add webhook in Stripe Dashboard**:
   - URL: `https://torptcg.netlify.app/.netlify/functions/stripe-webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`

2. **Get webhook signing secret**:
   - Copy the signing secret (starts with `whsec_`)
   - Add to Netlify environment variables:
     - Name: `STRIPE_WEBHOOK_SECRET`
     - Value: `whsec_...`

3. **Update webhook function** to verify signatures (for security)

## Testing Without Webhooks (Temporary)

If you want to test stock updates without webhooks:

1. After checkout, manually call the inventory function
2. Or add a "Sync Stock" button in admin panel
3. Or update stock when user returns to success page

But webhooks are the proper solution!

---

**Next Step**: Can you check your terminal when you complete a purchase and tell me if you see any webhook logs?
