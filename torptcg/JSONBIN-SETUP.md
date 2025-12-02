# JSONBin Setup Instructions

## Inventory Bin (Products)

I've created `inventory.json` with sample products for Sealed, Accessories, and 3D Prints categories.

### Steps to Upload:

1. **Go to JSONBin.io**: https://jsonbin.io
2. **Create New Bin**:
   - Click "Create Bin"
   - Copy the contents of `inventory.json` and paste it
   - Name it: "TorpTCG Inventory"
   - Click "Create"

3. **Copy the Bin ID**:
   - After creating, you'll see a URL like: `https://api.jsonbin.io/v3/b/YOUR_BIN_ID`
   - Copy just the ID part (e.g., `6927370eae596e708f7294be`)

4. **Update config.js**:
   - Open `netlify/functions/config.js`
   - Replace line 4 with your new bin ID:
   ```javascript
   EXTERNAL_JSON_URL: "https://api.jsonbin.io/v3/b/YOUR_NEW_BIN_ID",
   ```

5. **Restart Netlify Dev**:
   - Stop the current `netlify dev` process (Ctrl+C)
   - Run `netlify dev` again

## Current Card Bins (Already Set Up)

Your card bins are already configured correctly in `netlify/functions/cards.js`:
- calm: `692da2d1d0ea881f400b9ff3`
- fury: `692da2d2d0ea881f400b9ff6`
- order: `692da2d3d0ea881f400b9ffc`
- chaos: `692da2d443b1c97be9d09818`
- mind: `692da2d543b1c97be9d0981c`
- body: `692da2d6d0ea881f400ba004`
- dual: `692da2d7d0ea881f400ba009`

## What's in inventory.json

- **Sealed Products** (3 items): Booster boxes and starter decks
- **Accessories** (3 items): Plushie, playmat, dice set
- **3D Prints** (3 items): Deck box, dice tower, card holders

You can edit this file to add/remove products before uploading to JSONBin.
