# Quick Fix Guide for Border Issues

## Problem 1: "All" page showing rainbow borders on everything
## Problem 2: Square borders instead of rounded
## Problem 3: Singles styling doesn't match All page

---

## Fix 1: Remove `border-radius` from gradient rules in styles.css

**Find these lines (around 324, 338):**
```css
border-radius: 16px;
```

**Delete them from:**
- The rainbow gradient rule (line ~324)
- The dual-domain rule (line ~338)

**Why:** `border-image` doesn't support `border-radius`. The rounded corners come from the base `.product-card` rule.

---

## Fix 2: Remove the comment line in styles.css

**Find and DELETE this line (around line 328):**
```css
/* Add this AFTER the rainbow gradient rule in styles.css (after line 325) */
```

---

## Fix 3: Restore dual-domain support in cards-script.js

**Find this section (around line 260):**
```javascript
// Add domain data attribute for CSS styling
const domainId = card.domain?.values?.[0]?.id || '';
console.log('Card:', card.name, 'Domain ID:', domainId, 'Domain:', card.domain); // ADD THIS LINE
if (domainId) {
    div.setAttribute('data-domain', domainId);
}
```

**Replace with:**
```javascript
// Add domain data attribute for CSS styling
const domains = card.domain?.values || [];
if (domains.length > 0) {
    const domainId = domains[0]?.id || '';
    if (domainId) {
        div.setAttribute('data-domain', domainId);
    }
    
    // For dual-domain cards, add second domain
    if (domains.length > 1) {
        const domainId2 = domains[1]?.id || '';
        if (domainId2) {
            div.setAttribute('data-domain-2', domainId2);
        }
    }
}
```

---

## After Making Changes:

1. Save both files
2. Hard refresh browser (Ctrl+Shift+R)
3. Test:
   - "All" page: Should show solid domain colors for singles, NO rainbow
   - "Singles" page: Should show domain colors
   - Dual cards: Should show gradient borders
   - Sealed/Accessories/Prints: Should show rainbow gradient

---

## Why This Fixes It:

1. **No more rainbow on All page**: Singles cards have `data-domain`, so they won't match `:not([data-domain])`
2. **Rounded borders**: Removing `border-radius` from gradient rules lets the base rule handle it
3. **Dual-domain support**: Restored the code that adds `data-domain-2` attribute
