# Master Inventory Bin Setup

## Step 1: Create the Bin

1. Go to https://jsonbin.io/
2. Click **Create Bin**
3. Name: **"torptcg-master-inventory"**
4. Paste this structure:

```json
{
  "inventory": [
    {
      "productId": "test-001",
      "binId": "692ec5feae596e708f7e5206",
      "category": "sealed",
      "stock": 10
    },
    {
      "productId": "test-002",
      "binId": "692ec5feae596e708f7e5206",
      "category": "accessories",
      "stock": 15
    }
  ],
  "binMapping": {
    "692ec5feae596e708f7e5206": "torptcg-products",
    "692da2d1d0ea881f400b9ff3": "riftbound-calm-cards",
    "692da2d2d0ea881f400b9ff6": "riftbound-fury-cards",
    "692da2d3d0ea881f400b9ffc": "riftbound-order-cards",
    "692da2d443b1c97be9d09818": "riftbound-chaos-cards",
    "692da2d543b1c97be9d0981c": "riftbound-mind-cards",
    "692da2d6d0ea881f400ba004": "riftbound-body-cards",
    "692da2d7d0ea881f400ba009": "riftbound-dual-cards"
  }
}
```

5. Click **Create**
6. Copy the **Bin ID**

## Step 2: Update Configuration

Add to `.env`:
```
MASTER_INVENTORY_BIN_ID=YOUR_NEW_BIN_ID
```

Add to `netlify.toml` (line 10):
```toml
MASTER_INVENTORY_BIN_ID = "YOUR_NEW_BIN_ID"
```

## Step 3: Restart
- Ctrl+C to stop netlify dev
- Run `netlify dev` again

## What This Does

The master inventory bin:
- Lists all in-stock items with their stock levels
- References which bin contains the full product data
- Provides category information for filtering
- Serves as single source of truth for availability

Products not in this bin are considered out-of-stock.
