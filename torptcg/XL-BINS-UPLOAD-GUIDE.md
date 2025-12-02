# XL Bins Upload Guide - JSONBin Pro

## Issue Summary

Even though JSONBin Pro supports XL Bins (up to 10MB), there's an **nginx server-level HTTP request size limit (~4MB)** that prevents automated uploads via the API. The file must be uploaded through the **web interface**.

## File Details
- **File**: `card-gallery.json`
- **Size**: 3.73 MB
- **Cards**: 531 cards
- **Status**: ✅ Ready for upload

## Upload Instructions (5 minutes)

### Step 1: Go to JSONBin
Visit: https://jsonbin.io/ and log in to your Pro account

### Step 2: Create XL Bin
1. Click **"Create Bin"** or go to https://jsonbin.io/app/bins/create
2. Look for the **"XL Bin"** option or file upload feature

### Step 3: Upload File
**Option A (Recommended):**
- Click **"Upload JSON File"** button
- Select `card-gallery.json` from your computer
- Wait for upload to complete

**Option B (If no upload button):**
- Open `card-gallery.json` in a text editor (VS Code, Notepad++, etc.)
- Select All (Ctrl+A) and Copy (Ctrl+C)
- Paste into the JSONBin editor
- This may be slow for large files

### Step 4: Configure Bin
- **Name**: `riftbound-card-gallery`
- **Privacy**: Set to **Public** (or keep private and use API key)
- Click **"Create"** or **"Save"**

### Step 5: Copy Bin ID
After creation, the URL will look like:
```
https://jsonbin.io/app/bins/67abc123def456789
```

The Bin ID is: `67abc123def456789`

**IMPORTANT**: Copy this ID!

### Step 6: Determine Bin Type
Check if it's an XL Bin or regular bin:
- If the URL contains `/xl/` it's an XL Bin
- Otherwise it's a regular bin

## Update Configuration

### For XL Bins
Edit `netlify/functions/config.js`:

```javascript
module.exports = {
    EXTERNAL_JSON_URL: "https://api.jsonbin.io/v3/b/6927370eae596e708f7294be",
    JSONBIN_API_KEY: "$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a",
    
    // XL Bin URL (note the /xl/ in the path)
    CARD_GALLERY_BIN: "https://api.jsonbin.io/v3/xl/b/YOUR_BIN_ID_HERE"
};
```

### For Regular Bins
```javascript
module.exports = {
    EXTERNAL_JSON_URL: "https://api.jsonbin.io/v3/b/6927370eae596e708f7294be",
    JSONBIN_API_KEY: "$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a",
    
    // Regular bin URL
    CARD_GALLERY_BIN: "https://api.jsonbin.io/v3/b/YOUR_BIN_ID_HERE"
};
```

## Update Cards Function (If Using XL Bin)

The cards function (`netlify/functions/cards.js`) already works with both regular and XL bins. No changes needed!

## Test the Setup

### 1. Deploy to Netlify
```bash
git add .
git commit -m "Add card gallery with JSONBin integration"
git push
```

### 2. Test the Endpoint
Visit:
```
https://your-site.netlify.app/.netlify/functions/cards
```

You should see the JSON response with all 531 cards.

### 3. Test the Search
1. Go to your website
2. Click the **"Singles"** filter button
3. The card search panel should appear
4. Try searching for a card name like "Ahri"

## Troubleshooting

### Upload Fails in Web Interface
- **Try a different browser** (Chrome, Firefox, Edge)
- **Clear browser cache** and try again
- **Split the file** into smaller chunks if necessary (though this defeats the purpose)

### Cards Endpoint Returns 502
- Verify the Bin ID in `config.js` is correct
- Check if you're using `/xl/b/` for XL bins or `/b/` for regular bins
- Ensure the bin is set to Public or you're using the correct API key

### Cards Endpoint Returns 503
- The `CARD_GALLERY_BIN` is not set in `config.js`
- Update the config file with your bin URL

### Search Panel Doesn't Appear
- Check browser console for JavaScript errors
- Verify the HTML for `card-search-panel` is in `index.html`
- Ensure the CSS styles are in `styles.css`

## Why Manual Upload?

Even with JSONBin Pro and XL Bins API:
1. **nginx limits** - Server has ~4MB HTTP request size limit
2. **API limitations** - The API endpoint has stricter limits than the web interface
3. **Web interface works** - The web UI can handle larger files through different upload mechanisms

## Alternative: Host Locally

If JSONBin upload continues to fail, you can host the card data locally:

1. Keep `card-gallery.json` in your repository
2. Update `netlify/functions/cards.js` to read from the file directly:

```javascript
const cardData = require('../../card-gallery.json');

exports.handler = async function (event, context) {
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(cardData)
    };
};
```

This is simpler but means the data is bundled with your deployment.

## Summary

✅ **File ready**: `card-gallery.json` (3.73 MB, 531 cards)
✅ **Function ready**: `netlify/functions/cards.js`
✅ **Config ready**: `netlify/functions/config.js` (needs bin ID)
✅ **UI ready**: Search panel in `index.html`

**Next step**: Upload the file via JSONBin web interface and update the config!
