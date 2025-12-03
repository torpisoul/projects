# Card OGN-259/298 Issue - Diagnosis and Fix

## Problem Summary

Card **OGN-259/298** (Calm/Chaos dual-type) was not displaying correctly on the product page.

## Root Cause Analysis

### What We Found:
1. **Master Inventory Entry EXISTS** ✅
   - Product ID: `ogn-259-298`
   - Bin ID: `692da2d1d0ea881f400b9ff3` (CALM bin - WRONG!)
   - Stock: 2
   - Category: singles

2. **Card Data MISSING** ❌
   - Card data not found in ANY bin (calm, fury, mind, body, chaos, order, OR dual)
   - This means the inventory entry was created but the actual card data was never added

3. **Expected Location**:
   - Should be in DUAL bin: `692da2d7d0ea881f400ba009`
   - Because it has TWO domains: Calm AND Chaos

## Why This Happened

When the card was added to inventory via the admin panel:
- The master inventory entry was created pointing to the CALM bin (probably because Calm was the first domain)
- But the card data itself was never actually added to any bin
- This creates an "orphaned" inventory entry

## The Fix

### Option 1: Automatic Fix (Recommended)
Run the provided script to automatically fetch and add the card:

```bash
node add-missing-card.js
```

This script will:
1. Fetch card data from Riftbound API
2. Add it to the dual bin
3. Update master inventory to point to dual bin

### Option 2: Manual Fix via Admin Panel
1. Go to your inventory admin page
2. Find card OGN-259/298
3. Delete the inventory entry
4. Re-add the card properly (it should auto-detect dual-type and use the dual bin)

### Option 3: Direct JSONBin Edit (Advanced)
If you have the card data, you can manually:
1. Add the card object to the dual bin's `page.cards.items` array
2. Update the master inventory entry to change `binId` to `692da2d7d0ea881f400ba009`

## Prevention

To prevent this in the future, ensure your admin panel's "Add Product" function:

1. **Checks domain count** before assigning bin:
   ```javascript
   const domains = product.domain?.values || [];
   const binId = domains.length > 1 
       ? DUAL_BIN_ID 
       : DOMAIN_BIN_MAP[domains[0]?.id];
   ```

2. **Adds card data to bin FIRST**, then creates inventory entry

3. **Validates** that the card exists in the bin before creating inventory entry

## Scripts Created

1. **search-card.js** - Searches all bins for a card
2. **add-missing-card.js** - Fetches from API and adds card properly
3. **fix-card-259.js** - Moves card between bins (if it existed)
4. **check-card-bin.js** - Checks master inventory for card location

## Next Steps

1. Run `node add-missing-card.js` to fix this specific card
2. Check if there are other orphaned inventory entries
3. Update admin panel to prevent this issue
4. Consider adding validation to the inventory function

## Testing

After running the fix:
1. Refresh your product page
2. Card OGN-259/298 should now appear
3. It should have the Calm/Chaos dual-type gradient border
4. Stock should show as 2
