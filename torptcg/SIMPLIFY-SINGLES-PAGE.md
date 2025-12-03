# Simplify Singles Page to Match All Page

## Goal:
Remove card badges, energy/might stats, and card code from Singles page to match the clean styling of the All page.

---

## In cards-script.js, find the HTML section (around line 288-320)

**Find this section:**
```javascript
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
```

**REPLACE with this simplified version:**
```javascript
// Build HTML matching product-card structure from All page
div.innerHTML = `
    <div class="card-image-wrapper">
        <img src="${imageUrl}" alt="${name}" class="product-image" loading="lazy">
        <span class="category-tag">Single Card</span>
    </div>
    <div class="product-details">
        ${stockStatus.label ? `<div class="stock-badge ${stockStatus.class}">${stockStatus.label}</div>` : ''}
        <h3 class="product-title">${name}</h3>
        <div class="product-price">View Details</div>
    </div>
`;
```

---

## What This Removes:
- ❌ Card type/rarity/domain badges (`.card-meta`)
- ❌ Energy and Might stats (`.card-stats`)
- ❌ Card code (`.card-code`)

## What This Keeps:
- ✅ Card image
- ✅ "Single Card" category tag
- ✅ Stock badge (In Stock, Low Stock, Out of Stock)
- ✅ Card name as title
- ✅ "View Details" as placeholder price

---

## Result:
Singles page will have the exact same clean layout as the All page, with domain-colored borders on hover and the 3D tilt effect!

Save the file and refresh to see the simplified, consistent styling across all pages. 🎨
