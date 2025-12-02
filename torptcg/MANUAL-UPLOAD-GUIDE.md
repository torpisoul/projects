# Manual Card Gallery Upload Guide

## Issue
The JSONBin API has HTTP request size limitations (~4MB) even on Pro plans, which prevents automated upload of the 3.7MB `card-gallery.json` file via script.

## Solution: Manual Upload via Web Interface

### Step 1: Prepare the File
The file `card-gallery.json` is ready for upload (3.7MB, 531 cards).

### Step 2: Upload to JSONBin

1. **Go to JSONBin.io**
   - Visit: https://jsonbin.io/
   - Log in to your Pro account

2. **Create New Bin**
   - Click the "Create Bin" button
   - Or go directly to: https://jsonbin.io/app/bins/create

3. **Name the Bin**
   - In the bin name field, enter: `riftbound-card-gallery`

4. **Upload the JSON**
   - **Option A (Recommended)**: Click "Upload JSON File" and select `card-gallery.json`
   - **Option B**: Open `card-gallery.json` in a text editor, copy all contents, and paste into the JSONBin editor

5. **Create the Bin**
   - Click "Create" or "Save"
   - Wait for the upload to complete (may take a few seconds for large files)

6. **Copy the Bin ID**
   - After creation, you'll see a URL like: `https://jsonbin.io/app/bins/67abc123def456789`
   - The Bin ID is the last part: `67abc123def456789`
   - **IMPORTANT**: Copy this ID!

### Step 3: Update Configuration

Update `netlify/functions/config.js` with your new Bin ID:

```javascript
// config.js for Netlify Functions
module.exports = {
    // Existing product inventory bin
    EXTERNAL_JSON_URL: "https://api.jsonbin.io/v3/b/6927370eae596e708f7294be",
    JSONBIN_API_KEY: "$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a",
    
    // Card gallery bin (replace with your actual bin ID)
    CARD_GALLERY_BIN: "https://api.jsonbin.io/v3/b/YOUR_BIN_ID_HERE"
};
```

Replace `YOUR_BIN_ID_HERE` with the Bin ID you copied in Step 2.

### Step 4: Create/Update Netlify Function for Cards

Create a new file `netlify/functions/cards.js`:

```javascript
// Netlify Function: cards
// Fetches card gallery data from JSONBin

const https = require('https');
const { CARD_GALLERY_BIN, JSONBIN_API_KEY } = require('./config.js');

// Helper function to make HTTP requests
function makeRequest(url, options) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    data: data
                });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
}

exports.handler = async function (event, context) {
    console.log("Cards function invoked");

    const headers = {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const url = new URL(CARD_GALLERY_BIN);
        const options = {
            method: 'GET',
            headers: {
                'X-Access-Key': JSONBIN_API_KEY
            }
        };

        const response = await makeRequest(url, options);

        if (!response.ok) {
            console.error('Failed to fetch from JSONBin:', response.status);
            return {
                statusCode: 502,
                headers,
                body: JSON.stringify({ error: "Failed to fetch card data" })
            };
        }

        const data = JSON.parse(response.data);
        const cardData = data?.record ?? data;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(cardData)
        };

    } catch (err) {
        console.error("Error:", err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Internal server error", message: err.message })
        };
    }
};
```

### Step 5: Update Frontend to Use Cards Function

Update `script.js` to fetch cards from the new endpoint when "Singles" filter is active.

Add this function:

```javascript
// Fetch cards from the cards endpoint
async function fetchCards() {
    try {
        const response = await fetch('/.netlify/functions/cards');
        if (!response.ok) {
            console.error('Failed to fetch cards:', response.status);
            return [];
        }
        
        const data = await response.json();
        
        // Handle the nested structure from card-gallery.json
        if (data.page && data.page.cards && data.page.cards.items) {
            return data.page.cards.items;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching cards:', error);
        return [];
    }
}
```

## Verification

After completing all steps:

1. Test the cards endpoint:
   ```
   https://your-site.netlify.app/.netlify/functions/cards
   ```

2. You should see the card data JSON response

3. The search panel on your site should now work with all 531 cards!

## Benefits of Single Bin Approach

✅ **Simpler** - One bin to manage instead of 7
✅ **Faster** - Single API call instead of multiple
✅ **Easier Updates** - Update one file instead of splitting and uploading 7
✅ **Pro Plan** - 10MB storage limit supports the 3.7MB file easily

## Troubleshooting

**If upload fails in web interface:**
- Try using the "Upload JSON File" button instead of copy/paste
- Ensure you're logged into your Pro account
- Check that the file is valid JSON (it should be)

**If the function returns an error:**
- Verify the Bin ID in `config.js` is correct
- Check that the API key is correct
- Ensure the bin is set to "Public" or the API key has access
