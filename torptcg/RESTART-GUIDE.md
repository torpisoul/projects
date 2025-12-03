# Quick Reference: Restarting Netlify Dev

After adding environment variables to `netlify.toml`, you need to restart the dev server:

## Steps:
1. In the terminal running `netlify dev`, press **Ctrl+C**
2. Run `netlify dev` again
3. Wait for "Server now ready on http://localhost:8888"

## What to Test After Restart:

### 1. Homepage (http://localhost:8888)
- Should load without errors
- Products should appear (if any exist in JSONBin)

### 2. Singles Section
- Click "Singles" filter button
- Cards should load
- **Test domain-colored borders**: Hover over cards - border should glow in domain color
- **Test dual domain filter**: Select two domains from dropdowns
- **Test card modal**: Click on a card image - should open full screen

### 3. Admin Pages
- **Card Inventory**: http://localhost:8888/admin/card-inventory.html
  - Should show all cards with stock controls
  - Can adjust stock levels
  
- **Product Dashboard**: http://localhost:8888/dashboard/index.html
  - Can add/edit sealed products, accessories, 3D prints

## If Still Getting Errors:

Check the terminal output for:
- "WARNING: JSONBIN_API_KEY not set" - means env vars still not loading
- "Failed to fetch from JSONBin: 404" - API key or bin URL is wrong
- "Failed to fetch from JSONBin: 401/403" - API key doesn't have access

The environment variables are now in `netlify.toml` so they should load automatically.
