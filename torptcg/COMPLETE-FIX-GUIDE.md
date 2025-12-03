# Complete Fix Guide for Domain-Based Border Colors

## Part 1: Update cards-script.js to add data-domain attribute

**File:** `cards-script.js` (around line 256-303)

**Find this section:**
```javascript
function createCardElement(card) {
    const div = document.createElement('div');
    div.className = 'card-item';

    // Extract data
    const name = card.name || 'Unknown';
```

**Replace the ENTIRE `createCardElement` function with:**
```javascript
function createCardElement(card) {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.setAttribute('data-product-id', card.id || card.publicCode);
    
    // Add domain data attribute for CSS styling
    const domainId = card.domain?.values?.[0]?.id || '';
    if (domainId) {
        div.setAttribute('data-domain', domainId);
    }

    // Extract data
    const name = card.name || 'Unknown';
    const imageUrl = card.cardImage?.url || '';
    const cardType = card.cardType?.type?.[0]?.label || 'Unknown';
    const rarity = card.rarity?.value?.label || '';
    const domain = card.domain?.values?.[0]?.label || '';
    const energy = card.energy?.value?.id;
    const might = card.might?.value?.id;
    const publicCode = card.publicCode || card.id;
    const stockStatus = getCardStockStatus(card);

    // Build HTML matching product-card structure
    div.innerHTML = `
        <div class="card-image-wrapper">
            <img src="${imageUrl}" alt="${name}" class="product-image" loading="lazy">
            <span class="category-tag">Single Card</span>
            ${stockStatus.label ? `<div class="stock-badge ${stockStatus.class}">${stockStatus.label}</div>` : ''}
        </div>
        <div class="product-details">
            <h3 class="product-title">${name}</h3>
            <div class="card-meta">
                ${cardType ? `<span class="card-badge badge-type">${cardType}</span>` : ''}
                ${rarity ? `<span class="card-badge badge-rarity">${rarity}</span>` : ''}
                ${domain ? `<span class="card-badge badge-domain">${domain}</span>` : ''}
            </div>
            ${(energy !== undefined || might !== undefined) ? `
                <div class="card-stats">
                    ${energy !== undefined ? `
                        <div class="stat-item">
                            <span class="stat-label">Energy:</span>
                            <span class="stat-value">${energy}</span>
                        </div>
                    ` : ''}
                    ${might !== undefined ? `
                        <div class="stat-item">
                            <span class="stat-label">Might:</span>
                            <span class="stat-value">${might}</span>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            <div class="card-code">${publicCode}</div>
        </div>
    `;

    return div;
}
```

---

## Part 2: Update styles.css with correct domain colors

**File:** `styles.css` (around line 274-309)

**Find the domain color section you just added and REPLACE it with:**
```css
/* Domain-specific border colors for singles */
.product-card[data-domain="fury"]:hover {
    border-color: #ff4757; /* Red */
    box-shadow: 0 20px 40px rgba(255, 71, 87, 0.4);
}

.product-card[data-domain="calm"]:hover {
    border-color: #10ac84; /* Green */
    box-shadow: 0 20px 40px rgba(16, 172, 132, 0.4);
}

.product-card[data-domain="mind"]:hover {
    border-color: #3498db; /* Blue */
    box-shadow: 0 20px 40px rgba(52, 152, 219, 0.4);
}

.product-card[data-domain="body"]:hover {
    border-color: #ff8c00; /* Orange */
    box-shadow: 0 20px 40px rgba(255, 140, 0, 0.4);
}

.product-card[data-domain="chaos"]:hover {
    border-color: #9b59b6; /* Purple */
    box-shadow: 0 20px 40px rgba(155, 89, 182, 0.4);
}

.product-card[data-domain="order"]:hover {
    border-color: #feca57; /* Yellow */
    box-shadow: 0 20px 40px rgba(254, 202, 87, 0.4);
}

/* Rainbow gradient for non-singles (products without data-domain) */
.product-card:not([data-domain]):hover {
    border-image: linear-gradient(135deg,
            #ff0080, #ff8c00, #40e0d0, #9b59b6, #ff0080) 1;
    box-shadow: 0 20px 40px rgba(255, 0, 128, 0.3);
}
```

---

## What This Does:

1. **cards-script.js changes:**
   - Changes class from `card-item` to `product-card` (matches All page)
   - Adds `data-domain` attribute with the domain ID (fury, calm, mind, body, chaos, order)
   - Updates HTML structure to match product cards

2. **styles.css changes:**
   - Updates colors to match your specification:
     - Calm = Green
     - Fury = Red
     - Mind = Blue
     - Body = Orange
     - Chaos = Purple
     - Order = Yellow
   - Removes redundant `border-radius` (already set on `.product-card`)

## After Making Changes:
1. Save both files
2. Hard refresh browser (Ctrl+Shift+R)
3. Test by hovering over cards on the Singles page
