# Shipping Configuration - UK Mainland Only

## Current Shipping Policy

**We ship to UK mainland addresses only.**

## What's Collected at Checkout

### ✅ Required Information:
- **Shipping Address** (UK addresses only)
- **Billing Address** (required)
- **Phone Number** (required)
- **Email Address** (automatically collected)

### ✅ Shipping Option:

**UK Mainland Shipping**
- Cost: **£3.50** (fixed rate)
- Delivery: **3-5 business days**
- Only available for: UK (Great Britain) addresses

## Checkout Experience

When customers proceed to checkout, they will:

1. See their cart items and total
2. Enter their UK shipping address
3. Enter their billing address
4. Provide their phone number
5. See the shipping message: *"We currently ship to UK mainland addresses only. Shipping cost is £3.50."*
6. Complete payment

## Country Restriction

The checkout **only accepts UK (GB) addresses** for shipping. Customers from other countries will not be able to complete checkout.

## What You Receive

When an order is placed, you'll receive (via Stripe webhook):
- Customer name
- Email address
- Phone number
- Full UK shipping address
- Billing address
- Order items and quantities
- Shipping cost (£3.50)

## Testing

To test the checkout:
1. Add items to cart
2. Click "Proceed to Checkout"
3. You'll see:
   - Shipping address form (UK only)
   - Billing address form
   - Phone number field
   - Single shipping option: "UK Mainland Shipping - £3.50"
   - Custom message about UK-only shipping

Use test card: **4242 4242 4242 4242**

## Future Expansion

If you decide to offer international shipping in the future, you can:
1. Update `allowed_countries` in the checkout function
2. Add additional shipping options with different rates
3. Update the custom shipping message

---

**Current Status**: UK Mainland Shipping Only ✅
