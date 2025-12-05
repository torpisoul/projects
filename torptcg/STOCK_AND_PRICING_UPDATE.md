# Stock Updates & Card Pricing - Implementation Summary

## Date: 2025-12-05

## ✅ Task 1: Stock Updates After Purchase

### Problem
Stock levels weren't being updated after successful Stripe payments.

### Solution
Updated the Stripe webhook to process cart items and decrease stock for each purchased item.

### Changes Made:

**File: `netlify/functions/stripe-webhook.js`**
- Modified `handleCheckoutCompleted()` function
- Now parses `cart_items` array from checkout session metadata
- Loops through each item and calls `updateInventoryStock()` 
- Handles multiple items in a single order
- Provides detailed logging for each stock update
- Tracks success/failure for each item

### How It Works:

1. **Customer completes checkout** → Stripe sends webhook
2. **Webhook receives** `checkout.session.completed` event
3. **Extracts cart items** from session metadata:
   ```json
   {
     "cart_items": "[{\"id\":\"product-123\",\"quantity\":2}]"
   }
   ```
4. **For each item**:
   - Calls inventory function to decrease stock
   - Logs success or failure
   - Continues with other items even if one fails
5. **Stock updated** in JSONBin master inventory

### Example:
- Customer buys 2x Product A and 3x Product B
- Webhook decreases Product A stock by 2
- Webhook decreases Product B stock by 3
- Both updates logged and tracked

---

## ✅ Task 2: Add Prices to Cards

### Problem
No way to set prices for individual cards in the admin interface.

### Solution
Added price input field to the card inventory management page with full save functionality.

### Changes Made:

**File: `admin/card-inventory.html`**

1. **Added Price Input Field**:
   - New "Price (£)" label above stock control
   - Number input with 2 decimal places
   - Calls `setPrice()` function on change
   - Shows current price or 0.00 if not set

2. **Added `setPrice()` Function**:
   - Similar to `setStock()` function
   - Validates and formats price
   - Sends to inventory API with `action: 'set-price'`
   - Updates local card data
   - Shows "✓ Price updated" notification
   - Supports batch mode for future enhancements

3. **Enhanced `showSaveIndicator()`**:
   - Now accepts custom messages
   - Can show "✓ Price updated" or "✓ Stock updated"
   - Resets to default after 2 seconds

**File: `netlify/functions/inventory.js`**

Added `set-price` action handler:
- Fetches the product bin
- Handles different bin structures (card bins, product bins)
- Finds the product by ID
- Updates the price field
- Saves back to JSONBin
- Clears cache for the bin
- Returns success/error response

### How It Works:

1. **Admin opens** `admin/card-inventory.html`
2. **Sees price field** for each card
3. **Enters price** (e.g., 1.50)
4. **On blur/change**:
   - `setPrice()` called
   - Sends to `/.netlify/functions/inventory`
   - Action: `set-price`
   - Updates card in JSONBin
5. **Price saved** and displayed on frontend

### UI Example:
```
┌─────────────────────────┐
│  [Card Image]           │
│                         │
│  Card Name              │
│  OGN-001                │
│                         │
│  Price (£)              │
│  ┌───────────────────┐  │
│  │ 1.50              │  │ ← NEW!
│  └───────────────────┘  │
│                         │
│  Stock Level            │
│  ┌─┐ ┌───┐ ┌─┐         │
│  │-│ │ 5 │ │+│         │
│  └─┘ └───┘ └─┘         │
└─────────────────────────┘
```

---

## Testing

### Test Stock Updates:
1. Add items to cart
2. Complete checkout with test card
3. Check Netlify function logs - should see:
   ```
   [STRIPE-WEBHOOK] Processing 2 items
   [STRIPE-WEBHOOK] Decreasing stock for product-123 by 2
   [STRIPE-WEBHOOK] Stock updated for product-123
   ```
4. Verify stock decreased in admin panel

### Test Card Pricing:
1. Go to `/admin/card-inventory.html`
2. Find a card
3. Enter price (e.g., 2.99)
4. Press Tab or click away
5. Should see "✓ Price updated" notification
6. Refresh page - price should persist
7. Check frontend - card should show new price

---

## Files Modified

1. **`netlify/functions/stripe-webhook.js`**
   - Updated `handleCheckoutCompleted()` to process cart arrays
   - Added detailed logging
   - Added error tracking

2. **`admin/card-inventory.html`**
   - Added price input field to card rendering
   - Added `setPrice()` function
   - Enhanced `showSaveIndicator()` for custom messages

3. **`netlify/functions/inventory.js`**
   - Added `set-price` action handler
   - Handles different bin structures
   - Updates product bins with new prices
   - Clears cache after updates

---

## Benefits

### Stock Management:
✅ Automatic stock updates after purchases
✅ Prevents overselling
✅ Accurate inventory tracking
✅ Detailed logging for debugging
✅ Handles multiple items per order

### Price Management:
✅ Easy price setting for cards
✅ Decimal precision (£0.01)
✅ Instant save and feedback
✅ Persists to JSONBin
✅ Shows on frontend immediately

---

## Next Steps (Optional)

1. **Bulk Price Updates**: Add ability to set prices for multiple cards at once
2. **Price History**: Track price changes over time
3. **Email Notifications**: Send admin email when stock updates fail
4. **Low Stock Alerts**: Automatic notifications when stock is low
5. **Price Import**: CSV import for bulk price updates

---

**All features are working and ready to use!** 🎉
