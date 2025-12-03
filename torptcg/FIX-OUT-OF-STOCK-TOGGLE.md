# Fix Instructions for Out-of-Stock Toggle

## Issue 1: Singles filter expanded by default
**File:** `script.js` (line 97-98)

**Change FROM:**
```javascript
const cardSearchPanel = document.getElementById('card-search-panel');
if (cardSearchPanel) cardSearchPanel.style.display = 'block';
```

**Change TO:**
```javascript
// Don't auto-show - let user toggle it
// const cardSearchPanel = document.getElementById('card-search-panel');
// if (cardSearchPanel) cardSearchPanel.style.display = 'block';
```

---

## Issue 2: Out-of-stock toggle not working
**File:** `script.js` (line 219-225)

**Change FROM:**
```javascript
function toggleOutOfStock() {
    const checkbox = document.getElementById('show-out-of-stock');
    showOutOfStock = checkbox.checked;

    const currentFilter = getCurrentFilterCategory();
    renderProducts(currentFilter);
}
```

**Change TO:**
```javascript
function toggleOutOfStock() {
    const checkbox = document.getElementById('show-out-of-stock');
    showOutOfStock = checkbox.checked;

    const currentFilter = getCurrentFilterCategory();
    
    // Re-render based on current view
    if (currentFilter === 'singles' && typeof renderCards === 'function') {
        renderCards(); // Re-render cards with new filter
    } else {
        renderProducts(currentFilter); // Re-render products
    }
}
```

---

## Testing Steps:
1. Save both changes
2. Refresh browser (Ctrl+Shift+R)
3. Test "All" page - toggle should add/remove out-of-stock items
4. Click "Singles" - filter panel should be collapsed
5. Click "Show Filters" button - panel should expand
6. Toggle "Show out-of-stock" on Singles page - should filter cards
