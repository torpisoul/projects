# Master Inventory Structure Explained

The **Master Inventory** is the single source of truth for stock levels across all product categories.

## Structure

It is a simple JSON object containing an array of inventory items:

```json
{
  "inventory": [
    {
      "productId": "ogn-056",          // Matches 'id' in the product/card data
      "binId": "692da2d2d0ea881f400b9ff6", // The bin where full details are stored
      "category": "singles",           // Category for filtering
      "stock": 3,                      // Current stock level
      "preOrder": false                // Optional: allow pre-orders
    },
    {
      "productId": "sealed-booster-001",
      "binId": "692ec5feae596e708f7e5206",
      "category": "sealed",
      "stock": 10
    }
  ]
}
```

## How It Works

1. **Reading Data**:
   - The system fetches this master list first.
   - It then groups items by `binId`.
   - It fetches the full data from each referenced bin.
   - It merges the `stock` from here with the details (title, image, price) from the other bins.

2. **Writing Data**:
   - When you update stock, you ONLY update this master inventory bin.
   - You do NOT need to touch the card data bins or product bins (unless changing price/title).

## Bin Mapping

| Category | Bin Name | Bin ID |
|----------|----------|--------|
| **Products** | `torptcg-products` | `692ec5feae596e708f7e5206` |
| **Cards (Calm)** | `riftbound-calm-cards` | `692da2d1d0ea881f400b9ff3` |
| **Cards (Fury)** | `riftbound-fury-cards` | `692da2d2d0ea881f400b9ff6` |
| **Cards (Order)** | `riftbound-order-cards` | `692da2d3d0ea881f400b9ffc` |
| **Cards (Chaos)** | `riftbound-chaos-cards` | `692da2d443b1c97be9d09818` |
| **Cards (Mind)** | `riftbound-mind-cards` | `692da2d543b1c97be9d0981c` |
| **Cards (Body)** | `riftbound-body-cards` | `692da2d6d0ea881f400ba004` |
| **Cards (Dual)** | `riftbound-dual-cards` | `692da2d7d0ea881f400ba009` |

## Admin Updates Required

To make the admin pages work with this new structure:

1. **Card Inventory Page**: Needs to send `binId` (based on card domain) when adding stock for the first time.
2. **Product Dashboard**: Needs to save product details to `torptcg-products` bin AND stock to `master-inventory` bin.
