# FINAL FIX: Add Domain Attributes to script.js

## The Problem:
Singles cards on the "All" page don't have `data-domain` attributes, so they're getting rainbow borders instead of domain-specific colors.

## The Solution:
Update the `createProductCard` function in `script.js` to add domain attributes for singles.

---

## In script.js, find the `createProductCard` function (around line 137-171)

**REPLACE the entire function with this:**

```javascript
function createProductCard(product) {
    const stockStatus = getStockStatus(product);
    const stockClass = getStockClass(product);
    const purchasable = canPurchase(product);
    const priceDisplay = typeof product.price === 'number' ? `£${product.price.toFixed(2)}` : product.price;

    let buttonText = 'Add to Cart';
    let buttonAction = `handleAddToCart('${product.id}')`;

    if (!purchasable) {
        buttonText = 'Unavailable';
    } else if (product.stock === 0 && product.preOrder) {
        buttonText = 'Pre-Order';
    } else if (product.stock === 0) {
        buttonText = 'Notify Me';
        buttonAction = `notifyMe('${product.title}')`;
    }

    // Add data-domain attribute for singles cards
    let domainAttr = '';
    let domainAttr2 = '';
    if (product.category === 'singles' && product.domain?.values) {
        const domains = product.domain.values;
        if (domains.length > 0 && domains[0]?.id) {
            domainAttr = ` data-domain="${domains[0].id}"`;
        }
        if (domains.length > 1 && domains[1]?.id) {
            domainAttr2 = ` data-domain-2="${domains[1].id}"`;
        }
    }

    return `
        <div class="product-card" data-product-id="${product.id}"${domainAttr}${domainAttr2}>
            <div class="card-image-wrapper">
                <img src="${product.image}" alt="${product.title}" class="product-image">
                <span class="category-tag">${getCategoryName(product.category)}</span>
            </div>
            <div class="product-details">
                <div class="stock-badge ${stockClass}">${stockStatus}</div>
                <h3 class="product-title">${product.title}</h3>
                <div class="product-price">${priceDisplay}</div>
                <button class="btn-add" ${!purchasable ? 'disabled' : ''} onclick="${buttonAction}">
                    ${buttonText}
                </button>
            </div>
        </div>
    `;
}
```

---

## What This Does:

1. **Checks if product is a single card**: `if (product.category === 'singles' && product.domain?.values)`
2. **Adds domain attributes**: Creates `data-domain` and `data-domain-2` attributes
3. **Injects into HTML**: Adds the attributes to the div: `<div class="product-card"${domainAttr}${domainAttr2}>`

## Result:

- ✅ Singles on "All" page get domain-colored borders
- ✅ Sealed/Accessories/Prints get rainbow borders (no data-domain)
- ✅ Dual-domain cards get gradient borders
- ✅ Consistent styling across all pages

---

## After Making This Change:

1. Save `script.js`
2. Hard refresh browser (Ctrl+Shift+R)
3. Test "All" page - singles should have domain colors, other products should have rainbow
