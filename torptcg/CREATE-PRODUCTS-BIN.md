# Quick Fix: Create Products Bin

You have all the card bins, but you need ONE MORE bin for products (sealed, accessories, 3D prints).

## Create the Products Bin

1. Go to JSONBin.io
2. Click **Create Bin**
3. Name it: **"torptcg-products"**
4. Paste this data:
```json
{
  "products": [
    {
      "id": "test-001",
      "title": "Test Sealed Booster Box",
      "category": "sealed",
      "price": 89.99,
      "image": "https://via.placeholder.com/300x400/1a1d24/ff8c42?text=Booster+Box",
      "stock": 5,
      "available": true,
      "preOrder": false
    },
    {
      "id": "test-002",
      "title": "Test Deck Box",
      "category": "accessories",
      "price": 12.99,
      "image": "https://via.placeholder.com/300x400/1a1d24/c0c0c0?text=Deck+Box",
      "stock": 15,
      "available": true,
      "preOrder": false
    }
  ]
}
```
5. Click **Create**
6. Copy the new **Bin ID**

## Update Your Config

Once you have the new bin ID, update these files:

### `.env` file:
```
JSONBIN_API_KEY=your_api_key_here
JSONBIN_INVENTORY_BIN=https://api.jsonbin.io/v3/b/YOUR_NEW_BIN_ID
CARD_INVENTORY_BIN_ID=692e1a8443b1c97be9d1746c
```

### `netlify.toml` (lines 7-9):
```toml
[dev.env]
  JSONBIN_API_KEY = "your_api_key_here"
  JSONBIN_INVENTORY_BIN = "https://api.jsonbin.io/v3/b/YOUR_NEW_BIN_ID"
  CARD_INVENTORY_BIN_ID = "692e1a8443b1c97be9d1746c"
```

## Restart
1. Ctrl+C to stop netlify dev
2. Run `netlify dev` again
3. Visit http://localhost:8888

You should see the test products!
