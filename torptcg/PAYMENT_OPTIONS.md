# Payment Integration Options for TorpTCG

## Overview
This document outlines free and secure payment alternatives to Shopify for the TorpTCG e-commerce site.

## Recommended Solutions

### 1. **Stripe** (RECOMMENDED - Already Partially Integrated)
- **Cost**: No monthly fees, 1.5% + 20p per transaction (UK cards)
- **Pros**:
  - Already have Stripe webhook integration in place
  - Powerful API with excellent documentation
  - Supports Payment Links (no coding required)
  - Stripe Checkout (hosted payment page)
  - Strong fraud prevention built-in
  - PCI compliant
  - Supports subscriptions, one-time payments
  - Excellent for developers
- **Cons**:
  - Slightly higher learning curve for advanced features
- **Integration**: 
  - Use Stripe Checkout Sessions for full cart checkout
  - Or use Payment Links for individual products
  - Webhook already configured for inventory updates

### 2. **PayPal**
- **Cost**: No monthly fees, 2.9% + 30p per transaction
- **Pros**:
  - Widely trusted by customers
  - Easy integration
  - Buyer protection builds trust
  - Supports 25+ currencies
  - No setup fees
- **Cons**:
  - Higher fees for international transactions
  - Less developer-friendly than Stripe
- **Integration**: PayPal Smart Buttons or PayPal Checkout

### 3. **Square**
- **Cost**: No monthly fees, 1.75% per transaction (online)
- **Pros**:
  - Flat-rate pricing
  - Free POS software
  - Good for omnichannel (online + in-person)
  - Square Online has free plan
- **Cons**:
  - Less flexible API than Stripe
  - Primarily US-focused (expanding to UK)
- **Integration**: Square Payment Form or Square Checkout

## Current Implementation Status

### What's Already Built:
1. ✅ Shopping cart system with localStorage
2. ✅ Cart sidebar UI with quantity management
3. ✅ Stripe webhook handler for inventory updates
4. ✅ Product card layout with dynamic sizing
5. ✅ Add to cart functionality

### What Needs to be Added:
1. ⏳ Stripe Checkout Session integration
2. ⏳ Stock reservation during checkout
3. ⏳ Order confirmation page
4. ⏳ Email notifications (via Netlify Functions)

## Implementation Plan for Stripe Checkout

### Step 1: Create Netlify Function for Checkout Session
```javascript
// netlify/functions/create-checkout.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const { items } = JSON.parse(event.body);
  
  const line_items = items.map(item => ({
    price_data: {
      currency: 'gbp',
      product_data: {
        name: item.title,
        images: [item.image],
      },
      unit_amount: Math.round(item.price * 100), // Convert to pence
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items,
    mode: 'payment',
    success_url: `${process.env.URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.URL}`,
    metadata: {
      cart_items: JSON.stringify(items.map(i => ({ id: i.id, quantity: i.quantity }))),
    },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ sessionId: session.id }),
  };
};
```

### Step 2: Update cart.js proceedToCheckout()
```javascript
async function proceedToCheckout() {
  if (cart.length === 0) return;
  
  try {
    const response = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart }),
    });
    
    const { sessionId } = await response.json();
    
    // Redirect to Stripe Checkout
    const stripe = Stripe(process.env.STRIPE_PUBLISHABLE_KEY);
    await stripe.redirectToCheckout({ sessionId });
  } catch (error) {
    alert('Checkout error. Please try again.');
  }
}
```

### Step 3: Handle Successful Payment
The existing Stripe webhook will:
1. Receive `checkout.session.completed` event
2. Update inventory for purchased items
3. Clear the cart (via success page)

## Security Considerations

### All Solutions Provide:
- ✅ PCI DSS compliance (payment data never touches your server)
- ✅ SSL/TLS encryption
- ✅ Fraud detection
- ✅ 3D Secure authentication
- ✅ Secure tokenization

### Best Practices:
1. Never store card details
2. Use environment variables for API keys
3. Validate webhook signatures
4. Implement rate limiting
5. Log all transactions

## Cost Comparison (for £1000 monthly revenue)

| Provider | Transaction Fee | Monthly Cost |
|----------|----------------|--------------|
| Stripe   | 1.5% + 20p     | £35.00       |
| PayPal   | 2.9% + 30p     | £59.00       |
| Square   | 1.75%          | £17.50       |

**Note**: Stripe offers the best balance of features, security, and developer experience for your use case.

## Recommendation

**Use Stripe Checkout** because:
1. You already have Stripe webhook infrastructure
2. Best developer experience
3. Excellent documentation
4. Strong fraud prevention
5. Competitive pricing
6. Supports future features (subscriptions, etc.)

## Alternative: Stripe Payment Links (Quickest Setup)

For immediate implementation without coding:
1. Create Payment Links in Stripe Dashboard for each product
2. Store payment link URL in product data
3. Replace "Add to Cart" with "Buy Now" linking to Payment Link
4. Webhook handles inventory automatically

**Pros**: No checkout coding needed
**Cons**: No cart functionality, one item at a time

## Next Steps

1. Set up Stripe Checkout Session function
2. Add Stripe.js to frontend
3. Update proceedToCheckout() function
4. Create success/cancel pages
5. Test with Stripe test mode
6. Go live with real API keys
