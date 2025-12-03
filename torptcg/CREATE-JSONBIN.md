# SOLUTION: Create Your Own JSONBin

## The Problem
The bin ID `6927370eae596e708f7294be` in the configuration doesn't exist or your API key doesn't have access to it. You need to create your own JSONBin.

## Quick Setup (5 minutes)

### Step 1: Create JSONBin Account
1. Go to https://jsonbin.io/
2. Sign up for a free account
3. Go to **API Keys** and copy your API key

### Step 2: Create Inventory Bin
1. Click **Create Bin**
2. Name it: "TorpTCG Inventory"
3. Paste this initial data:
```json
{
  "products": [
    {
      "id": "test-001",
      "title": "Test Sealed Product",
      "category": "sealed",
      "price": 25.99,
      "image": "https://via.placeholder.com/300x400",
      "stock": 10,
      "available": true,
      "preOrder": false
    }
  ]
}
```
4. Click **Create**
5. Copy the **Bin ID** (it will look like: `675d1234abc567890def1234`)

### Step 3: Create Card Inventory Bin
1. Click **Create Bin** again
2. Name it: "TorpTCG Card Inventory"
3. Paste this:
```json
{
  "inventory": []
}
```
4. Click **Create**
5. Copy this **Bin ID** too

### Step 4: Update Your Configuration

Edit `.env` file:
```
JSONBIN_API_KEY=your_actual_api_key_from_step_1
JSONBIN_INVENTORY_BIN=https://api.jsonbin.io/v3/b/YOUR_INVENTORY_BIN_ID
CARD_INVENTORY_BIN_ID=YOUR_CARD_INVENTORY_BIN_ID
```

Edit `netlify.toml` (lines 7-9):
```toml
[dev.env]
  JSONBIN_API_KEY = "your_actual_api_key"
  JSONBIN_INVENTORY_BIN = "https://api.jsonbin.io/v3/b/YOUR_INVENTORY_BIN_ID"
  CARD_INVENTORY_BIN_ID = "YOUR_CARD_INVENTORY_BIN_ID"
```

### Step 5: Restart
1. Stop netlify dev (Ctrl+C)
2. Run `netlify dev` again
3. Visit http://localhost:8888

You should now see the test product!

## Why This Happened
The old bin IDs in the documentation were from a previous setup and don't exist in your JSONBin account. Each JSONBin account has its own bins with unique IDs.

## Next Steps After It Works
1. Add more products via the dashboard: http://localhost:8888/dashboard/index.html
2. Upload card data to test the Singles section
3. Test all the UI features we implemented
