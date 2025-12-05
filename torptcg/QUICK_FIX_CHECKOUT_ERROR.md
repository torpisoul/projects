# Quick Fix for Checkout Error

## The Issue
The checkout is returning a 500 error because the Stripe API key is not configured.

## Quick Fix (2 Steps)

### Step 1: Get Your Stripe Test Key

1. Go to https://dashboard.stripe.com/register (or login if you have an account)
2. Click **Developers** in the left sidebar
3. Click **API keys**
4. Find your **Secret key** (starts with `sk_test_`)
5. Click **Reveal test key** and copy it

### Step 2: Add to Your .env File

1. In your project root, you should have a `.env` file
   - If not, copy `.env.example` to `.env`
2. Open `.env` and add this line:
   ```
   STRIPE_SECRET_KEY=sk_test_paste_your_key_here
   ```
3. Save the file
4. Restart `netlify dev`

## Example .env File

Your `.env` file should look like this:

```bash
# JSONBin Configuration
JSONBIN_API_KEY=$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a
MASTER_INVENTORY_BIN_ID=692ed2dbae596e708f7e68f9
# ... other existing variables ...

# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_51ABC123...your_actual_key_here
```

## Test It

1. Restart `netlify dev`
2. Add items to cart
3. Click "Proceed to Checkout"
4. You should be redirected to Stripe Checkout
5. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/34)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)

## Still Getting Errors?

Check the Netlify Dev terminal output for specific error messages. Common issues:

- **"Stripe is not defined"**: The stripe package is now installed ✅
- **"Invalid API key"**: Double-check you copied the full key from Stripe
- **"No such API key"**: Make sure you're using the **Secret key** (starts with `sk_test_`), not the Publishable key

## What's Already Done

✅ Stripe package installed (`npm install` completed)
✅ `.env.example` updated with Stripe key placeholder
✅ Netlify function created and ready

**You just need to add your Stripe API key to the `.env` file!**
