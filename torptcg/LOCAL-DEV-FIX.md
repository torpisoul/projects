# Quick Fix for Local Development

## Problem
The JSONBin API is returning 502 errors because environment variables aren't set for local development.

## Solution

### Step 1: Create .env file
Create a file called `.env` in the project root (`c:\Users\torpi\Documents\GitHub\colourcraft\torptcg\.env`) with this content:

```
JSONBIN_API_KEY=$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a
JSONBIN_INVENTORY_BIN=https://api.jsonbin.io/v3/b/6927370eae596e708f7294be
CARD_INVENTORY_BIN_ID=692e1a8443b1c97be9d1746c
```

### Step 2: Restart netlify dev
After creating the `.env` file:
1. Stop the current `netlify dev` process (Ctrl+C)
2. Run `netlify dev` again
3. The functions should now work

### Step 3: Access Admin Page
The card inventory admin page is at:
**http://localhost:8888/admin/card-inventory.html**

## Testing Checklist

Once the server restarts with environment variables:

1. **Homepage**: http://localhost:8888
   - Should show products (if any exist in JSONBin)
   
2. **Singles Section**: Click "Singles" filter
   - Should load card data
   - Test domain-colored borders by hovering over cards
   - Test dual domain filter
   - Click card image to test full-screen modal

3. **Admin Page**: http://localhost:8888/admin/card-inventory.html
   - Add/adjust stock for cards
   - Test batch operations

## Note
The `.env` file is gitignored (which is correct for security). You'll need to create it manually on each development machine.
