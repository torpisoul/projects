# CRITICAL FIXES NEEDED

## Issue Summary
The user wants ALL category buttons (All, Singles, Sealed, Accessories, 3D Prints) to work the SAME WAY - they should all just filter the same product cards from the inventory.

Currently, "Singles" is switching to a completely different rendering system (card gallery), which is wrong.

## Required Changes:

### 1. script.js - Remove special Singles handling
- Line 95-107: Remove the `if (filter === 'singles')` special case
- Singles should filter products just like sealed/accessories/prints do

### 2. script.js - Fix toggleOutOfStock  
- Line 232-244: Remove the special case for singles in toggleOutOfStock
- Should always call `renderProducts(currentFilter)`

### 3. script.js - Fix filterProducts
- Line 190-215: Remove special handling for singles
- All categories should work the same way

### 4. styles.css - Add domain-specific hover styles
Need to add these missing styles (they were in a previous version but got lost):

```css
/* Domain-specific border colors for singles */
.product-card[data-domain="fury"]:hover {
    border-color: var(--domain-fury);
    box-shadow: 0 0 20px rgba(187, 14, 28, 0.4);
}

.product-card[data-domain="calm"]:hover {
    border-color: var(--domain-calm);
    box-shadow: 0 0 20px rgba(16, 172, 55, 0.4);
}

.product-card[data-domain="mind"]:hover {
    border-color: var(--domain-mind);
    box-shadow: 0 0 20px rgba(22, 125, 194, 0.4);
}

.product-card[data-domain="body"]:hover {
    border-color: var(--domain-body);
    box-shadow: 0 0 20px rgba(201, 110, 0, 0.4);
}

.product-card[data-domain="chaos"]:hover {
    border-color: var(--domain-chaos);
    box-shadow: 0 0 20px rgba(97, 16, 129, 0.4);
}

.product-card[data-domain="order"]:hover {
    border-color: var(--domain-order);
    box-shadow: 0 0 20px rgba(252, 193, 68, 0.4);
}
```

### 5. styles.css - Fix toggle styling
The toggle switch styling needs to be reviewed - user says it looks "weird"

## Next Steps:
1. Restore script.js from the correct backup (the one with fetchProducts from inventory endpoint)
2. Make the 3 targeted fixes to remove singles special handling
3. Add the domain-specific hover styles to styles.css
4. Test that all filters work the same way
