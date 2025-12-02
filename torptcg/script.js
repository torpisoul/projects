// ============================================
// GLOBAL STATE
// ============================================

let showOutOfStock = false;

// ============================================
// 1. INVENTORY MANAGEMENT
// ============================================

async function fetchProducts() {
    try {
        const response = await fetch('/.netlify/functions/inventory');
        if (!response.ok) {
            console.warn('Inventory endpoint returned error, using fallback');
            return [];
        }
        const data = await response.json();
        const products = Array.isArray(data) ? data : (data.products || []);
        return products;
    } catch (error) {
        console.error('Error loading inventory:', error);
        return [];
    }
}

async function updateStock(productId, quantity) {
    try {
        const response = await fetch('/.netlify/functions/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, delta: -quantity })
        });

        const result = await response.json();

        if (!response.ok) {
            if (response.status === 409) {
                return { success: false, error: 'insufficient_stock', data: result };
            }
            return { success: false, error: 'update_failed', data: result };
        }

        return { success: true, data: result };
    } catch (error) {
        console.error('Error updating stock:', error);
        return { success: false, error: 'network_error' };
    }
}

// ============================================
// 2. STOCK HELPERS
// ============================================

function getStockStatus(product) {
    const stock = product.stock || 0;
    if (stock === 0) {
        return product.preOrder ? "Made to Order" : "Out of Stock";
    }
    if (stock <= 5) {
        return `Only ${stock} left!`;
    }
    return "In Stock";
}

function getStockClass(product) {
    const stock = product.stock || 0;
    if (stock === 0 && !product.preOrder) return 'stock-out';
    if (stock <= 5) return 'stock-low';
    return 'stock-in';
}

function canPurchase(product) {
    return product.available !== false && (product.stock > 0 || product.preOrder === true);
}

function getCategoryName(cat) {
    const map = {
        'singles': 'Single Card',
        'sealed': 'Sealed Product',
        'accessories': 'Accessory',
        'prints': '3D Print'
    };
    return map[cat] || cat;
}

// ============================================
// 3. RENDER PRODUCTS
// ============================================

async function renderProducts(filter = 'all') {
    const container = document.getElementById('product-container');
    if (!container) return;

    // Handle Singles (Card Gallery) separately
    if (filter === 'singles') {
        const cardSearchPanel = document.getElementById('card-search-panel');
        if (cardSearchPanel) cardSearchPanel.style.display = 'block';

        if (typeof initCardSearch === 'function') {
            initCardSearch();
        } else {
            console.error('initCardSearch function not found');
            container.innerHTML = '<div class="no-results">Card search module not loaded.</div>';
        }
        return;
    }

    // Hide card search panel for other categories
    const cardSearchPanel = document.getElementById('card-search-panel');
    if (cardSearchPanel) cardSearchPanel.style.display = 'none';

    container.classList.remove('card-gallery-grid');
    container.classList.add('product-grid');
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Loading products...</div>';

    const allProducts = await fetchProducts();
    let products = showOutOfStock ? allProducts : allProducts.filter(p => p.stock > 0 || p.preOrder);

    const filteredProducts = filter === 'all' ? products : products.filter(p => p.category === filter);

    container.innerHTML = '';

    if (filteredProducts.length === 0) {
        container.innerHTML = '<div class="no-results">No products found in this category.</div>';
        return;
    }

    filteredProducts.forEach(product => {
        const cardHTML = createProductCard(product);
        container.innerHTML += cardHTML;
    });

    setTimeout(initTiltEffect, 100);
}

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

    return `
        <div class="product-card" data-product-id="${product.id}">
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

// ============================================
// 4. FILTER FUNCTIONS
// ============================================

function filterProducts(category) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const buttons = document.querySelectorAll('.filter-btn');
    for (let btn of buttons) {
        const onclick = btn.getAttribute('onclick');
        if (onclick && onclick.includes(category)) {
            btn.classList.add('active');
            break;
        }
    }

    const showFiltersContainer = document.getElementById('show-filters-container');
    const cardSearchPanel = document.getElementById('card-search-panel');

    if (category === 'singles') {
        if (showFiltersContainer) showFiltersContainer.style.display = 'block';
        renderProducts(category);
    } else {
        if (showFiltersContainer) showFiltersContainer.style.display = 'none';
        if (cardSearchPanel) cardSearchPanel.style.display = 'none';
        renderProducts(category);
    }
}

function getCurrentFilterCategory() {
    const activeBtn = document.querySelector('.filter-btn.active');
    if (!activeBtn) return 'all';

    const onclick = activeBtn.getAttribute('onclick');
    if (!onclick) return 'all';

    const match = onclick.match(/filterProducts\('(.+?)'\)/);
    return match ? match[1] : 'all';
}

// ============================================
// 5. TOGGLE FUNCTIONS
// ============================================

function toggleOutOfStock() {
    const checkbox = document.getElementById('show-out-of-stock');
    showOutOfStock = checkbox.checked;

    const currentFilter = getCurrentFilterCategory();
    renderProducts(currentFilter);
}

function toggleCardSearch() {
    const panel = document.getElementById('card-search-panel');
    const button = document.getElementById('toggle-search');

    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        button.textContent = '▲ Hide Filters';

        if (window.initCardSearch) {
            window.initCardSearch();
        }
    } else {
        panel.style.display = 'none';
        button.textContent = '▼ Show Filters';
    }
}

// ============================================
// 6. CART & CHECKOUT
// ============================================

async function handleAddToCart(productId) {
    const products = await fetchProducts();
    const product = products.find(p => p.id === productId);

    if (!product) {
        alert('Product not found. Please refresh the page.');
        return;
    }

    if (!canPurchase(product)) {
        alert('This product is currently unavailable.');
        return;
    }

    const priceStr = typeof product.price === 'number' ? product.price.toFixed(2) : product.price;
    const stockStr = product.stock > 0 ? product.stock + ' available' : 'Made to order';
    const confirmed = confirm(`Add "${product.title}" to cart?\n\nPrice: £${priceStr}\nStock: ${stockStr}`);

    if (confirmed) {
        const result = await updateStock(productId, 1);

        if (result.success) {
            alert('✅ Added to cart! Stock updated.');
            const currentFilter = getCurrentFilterCategory();
            renderProducts(currentFilter);
        } else {
            if (result.error === 'insufficient_stock') {
                alert('❌ Sorry, this item is now out of stock. The page will refresh.');
                const currentFilter = getCurrentFilterCategory();
                renderProducts(currentFilter);
            } else {
                alert('❌ Unable to add to cart. Please try again.');
            }
        }
    }
}

function notifyMe(productTitle) {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });

        setTimeout(() => {
            const enquirySelect = document.querySelector('select[name="enquiry-type"]');
            const messageTextarea = document.querySelector('textarea[name="message"]');

            if (enquirySelect) {
                enquirySelect.value = 'notify';
            }

            if (messageTextarea) {
                messageTextarea.value = `Please notify me when "${productTitle}" is back in stock.`;
            }
        }, 500);
    }
}

// ============================================
// 7. 3D TILT EFFECT
// ============================================

function initTiltEffect() {
    const cards = document.querySelectorAll('.product-card');

    cards.forEach(card => {
        if (!card.dataset.styleId) {
            const styleId = 'card-style-' + Math.random().toString(36).substr(2, 9);
            card.dataset.styleId = styleId;
        }

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const xPct = x / rect.width;
            const yPct = y / rect.height;

            const xRot = (0.5 - yPct) * 15;
            const yRot = (xPct - 0.5) * 15;

            card.style.transform = `perspective(1000px) rotateX(${xRot}deg) rotateY(${yRot}deg) scale(1.05)`;

            const shineX = (xPct * 100).toFixed(0);
            const shineY = (yPct * 100).toFixed(0);

            const styleId = card.dataset.styleId;
            let styleEl = document.getElementById(styleId);

            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = styleId;
                document.head.appendChild(styleEl);
            }

            styleEl.textContent = `
                .product-card[data-style-id="${styleId}"]::before {
                    background: radial-gradient(
                        circle at ${shineX}% ${shineY}%,
                        rgba(255, 255, 255, 0.4) 0%,
                        rgba(255, 255, 255, 0.2) 20%,
                        rgba(255, 255, 255, 0.1) 40%,
                        transparent 60%
                    ) !important;
                }
            `;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';

            const styleId = card.dataset.styleId;
            const styleEl = document.getElementById(styleId);
            if (styleEl) {
                styleEl.textContent = '';
            }
        });
    });
}

// ============================================
// 8. INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('product-container')) {
        renderProducts('all');
    }
});