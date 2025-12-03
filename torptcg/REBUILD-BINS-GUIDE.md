# Rebuilding Card Bins from card-gallery.json

## Overview

This process rebuilds all card bins from the master `card-gallery.json` file with proper categorization and formatting.

## What It Does

### 1. **Reads card-gallery.json**
- Loads all cards from the local file
- No API calls needed - uses your existing data

### 2. **Categorizes Cards by Domain**
- **Single-domain cards** → Sorted into domain-specific bins (calm, fury, mind, body, chaos, order)
- **Dual-domain cards** → All go into the dedicated `dual` bin
- **No-domain cards** → Skipped with warning

### 3. **Formats Legend Cards**
- Detects cards with `cardType.values` containing `legend`
- Formats name as: `{tag}: {name}`
- Example: `Yasuo: Unforgiven` (instead of just `Unforgiven`)

### 4. **Uploads to JSONBin**
- Clears and rebuilds each bin
- Uploads categorized cards
- Maintains proper structure: `{ page: { cards: { items: [...] } } }`

## Running the Rebuild

```bash
node rebuild-card-bins.js
```

## What Gets Updated

### Bins Updated:
1. **Calm Bin** (`692da2d1d0ea881f400b9ff3`) - Single calm-domain cards
2. **Fury Bin** (`692da2d2d0ea881f400b9ff6`) - Single fury-domain cards
3. **Order Bin** (`692da2d3d0ea881f400b9ffc`) - Single order-domain cards
4. **Chaos Bin** (`692da2d443b1c97be9d09818`) - Single chaos-domain cards
5. **Mind Bin** (`692da2d543b1c97be9d0981c`) - Single mind-domain cards
6. **Body Bin** (`692da2d6d0ea881f400ba004`) - Single body-domain cards
7. **Dual Bin** (`692da2d7d0ea881f400ba009`) - ALL dual-domain cards

### What Doesn't Change:
- **Master Inventory Bin** - Not touched (keeps stock levels)
- **card-gallery.json** - Source file remains unchanged

## Expected Results

### Before:
- Cards in wrong bins (e.g., dual-type in single-domain bin)
- Legend cards showing as just "Name"
- Inconsistent categorization

### After:
- All dual-type cards in dual bin
- Legend cards showing as "Tag: Name"
- Consistent categorization by domain
- Proper gradient borders for dual-types

## Verification Steps

After running the script:

1. **Check JSONBin.io**
   - Log into JSONBin
   - Verify each bin has the correct number of cards
   - Spot-check a few dual-type cards are in the dual bin

2. **Check Product Page**
   - Refresh your website
   - Navigate to Singles filter
   - Verify dual-type cards show gradient borders
   - Verify legend cards show as "Tag: Name"

3. **Check Specific Card (OGN-259/298)**
   - Should now appear in products
   - Should show as "Yasuo: Unforgiven"
   - Should have Calm/Chaos gradient border

## Important Notes

### ⚠️ This Will Replace All Card Data in Bins
- Any manual edits to cards in bins will be lost
- Stock levels are safe (stored in master inventory)
- Prices are safe (if stored separately)

### ✅ Safe to Run Multiple Times
- Idempotent operation
- Can be run whenever card-gallery.json is updated
- No duplicate cards will be created

### 🔄 When to Run This
- After updating card-gallery.json with new cards
- When fixing categorization issues
- When adding new dual-type cards
- After format changes (like legend card naming)

## Troubleshooting

### "Card has no domains"
- Some cards in card-gallery.json might not have domain data
- These will be skipped with a warning
- Check the card data in card-gallery.json

### "Failed to update bin"
- Check your JSONBIN_API_KEY in .env
- Verify bin IDs in card-bins-config.json
- Check JSONBin rate limits

### "No cards in a bin"
- Normal if no cards of that domain exist
- Dual bin should have the most cards (all dual-types)

## Master Inventory Sync

After rebuilding bins, you may need to:

1. **Update Master Inventory** to point to correct bins
2. **Verify stock levels** are still correct
3. **Re-add any missing inventory entries**

Consider creating a separate script to sync master inventory with the new bin structure.

## Next Enhancement

Consider creating an automated sync that:
1. Reads card-gallery.json
2. Rebuilds bins
3. Updates master inventory to match
4. Validates all cards have correct stock entries

This would be a complete "reset to source of truth" operation.
