# Shipping Configuration Update

## What Was Added

### ✅ Shipping Address Collection
The checkout now collects:
- **Full shipping address** (required)
- **Billing address** (required)
- **Phone number** (required for shipping)
- **Email** (automatically collected by Stripe)

### ✅ Shipping Options

**Option 1: UK Standard Shipping**
- Cost: **£3.50**
- Delivery: **3-5 business days**
- For: Mainland UK addresses

**Option 2: International Shipping**
- Cost: **£0.00** (placeholder in checkout)
- Delivery: **7-14 business days**
- Note: Actual costs will be calculated and invoiced separately

### ✅ Custom Shipping Message

Customers will see this message when entering their shipping address:

> "Standard shipping (£3.50) is for mainland UK only. International orders will incur additional shipping costs which will be calculated and invoiced separately at the buyer's expense."

## How It Works

1. **Customer adds items to cart**
2. **Clicks "Proceed to Checkout"**
3. **Stripe Checkout page shows**:
   - Product details
   - Shipping address form
   - Billing address form
   - Phone number field
   - Shipping options (UK Standard or International)
   - Custom shipping note
4. **Customer selects shipping method**
5. **Completes payment**
6. **You receive order with full shipping details**

## Allowed Countries

The checkout accepts shipping addresses from:
- **UK** (Great Britain)
- **Europe**: Ireland, France, Germany, Spain, Italy, Netherlands, Belgium, Sweden, Norway, Denmark, Finland, Austria, Switzerland, Portugal, Greece, Poland, Czech Republic, Hungary, Romania, Bulgaria, Croatia, Slovakia, Slovenia, Lithuania, Latvia, Estonia, Cyprus, Malta, Luxembourg
- **Americas**: United States, Canada
- **Oceania**: Australia, New Zealand

## What You'll Receive

When an order is placed, you'll get (via Stripe webhook):
- Customer name
- Email address
- Phone number
- Full shipping address
- Selected shipping method
- Order items and quantities

## For International Orders

When you receive an international order:
1. Calculate actual shipping costs based on destination
2. Send a separate invoice to the customer for shipping
3. Ship once additional shipping payment is received

## Testing

To test the new shipping collection:
1. Add items to cart
2. Proceed to checkout
3. You'll see:
   - Shipping address fields
   - Billing address fields
   - Phone number field
   - Two shipping options
   - The custom shipping message

Use test card: **4242 4242 4242 4242**

## Notes

- The £3.50 UK shipping is charged immediately
- International shipping shows £0.00 but includes the note about additional costs
- All customer information is securely collected by Stripe
- Shipping details are included in the webhook payload

---

**Everything is configured and ready to use!** 🎉
