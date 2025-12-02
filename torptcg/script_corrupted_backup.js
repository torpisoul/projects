// ============================================
// GLOBAL STATE
// ============================================

let showOutOfStock = false;

// ============================================
// 1. INVENTORY MANAGEMENT SYSTEM
// ============================================

// Fetch products from inventory endpoint
async function fetchProducts() {
    try {
        const response = await fetch('/.netlify/functions/inventory');
        if (!response.ok) {
            console.warn('Inventory data not available, using fallback data');
            return getFallbackProducts();
        }
        const data = await response.json();
        const products = Array.isArray(data) ? data : (data.products || []);
        return products;
    } catch (error) {
        console.error('Error loading inventory:', error);
        return getFallbackProducts();
    }
}

// Update stock for a product
async function updateStock(productId, quantity) {
    try {
        const response = await fetch('/.netlify/functions/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: productId, delta: -quantity })
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

// Fallback products
function getFallbackProducts() {
    return [
        {
            id: "p001",
            title: "Riftbound: Origins Booster Box",
            category: "sealed",
            price: 120.00,
            image: "https://images.unsplash.com/photo-1620336655055-088d06e36bf0?auto=format&fit=crop&w=400&q=80",
            stock: 15,
            available: true
        },
        {
            id: "p002",
            title: "Void Walker (Ultra Rare)",
            category: "singles",
            price: 45.00,
            image: "https://images.unsplash.com/photo-1601987177651-8edfe6c20009?auto=format&fit=crop&w=400&q=80",
            stock: 3,
            available: true
        },
        {
            id: "p003",
            title: "Custom FDM Deck Box (Dragon)",
            category: "prints",
            price: 35.00,
            image: "https://images.unsplash.com/photo-1615815707923-2d1d9a637276?auto=format&fit=crop&w=400&q=80",
            stock: 0,
            available: true,
            preOrder: true
        },
        {
            id: "p004",
            title: "Riftbound Starter Deck: Aether",
            category: "sealed",
            price: 14.99,
            image: "https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb?auto=format&fit=crop&w=400&q=80",
            stock: 25,
            available: true
        },
        {
            id: "p005",
            title: "Chibi Voidling Plushie",
            category: "accessories",
            price: 18.00,
            image: "https://images.unsplash.com/photo-1559479014-48e5da45043b?auto=format&fit=crop&w=400&q=80",
            stock: 12,
            available: true
        },
        {
            id: "p006",
            title: "Bespoke Dice Tower (FDM)",
            category: "prints",
            price: 25.00,
            image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=400&q=80",
            stock: 5,
            available: true
        }
    ];
}

// ============================================
// 2. STOCK DISPLAY HELPERS
// ============================================

function getStockStatus(product) {
    const stock = product.stock || 0;
    if (stock === 0) {
        if (product.preOrder || product.available) {
            return "Made to Order";
        }
        return "Out of Stock";
    }
    if (stock <= 5) {
        return `Only ${stock} left!`;
    }
    return "In Stock";
}

function getStockClass(product) {
    const stock = product.stock || 0;
    if (stock === 0 && !product.preOrder && !product.available) {
        return 'stock-out';
    }
    if (stock <= 5) {
        return 'stock-low';
    }
    return 'stock-in';
}

function canPurchase(product) {
    return product.available !== false && (product.stock > 0 || product.preOrder === true);
}

// ============================================
// 3. RANDOM SELECTION HELPER
// ============================================
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
        <div class="product-card" data-product-id="${product.id}" data-aos="fade-up">
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
// 5. CART & CHECKOUT FUNCTIONS
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

function getCurrentFilterCategory() {
    const activeBtn = document.querySelector('.filter-btn.active');
    if (!activeBtn) return 'all';

    const onclick = activeBtn.getAttribute('onclick');
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
// 8. 3D TILT EFFECT
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
}

// ============================================
// 2. STOCK DISPLAY HELPERS
// ============================================

function getStockStatus(product) {
    const stock = product.stock || 0;
    if (stock === 0) {
        if (product.preOrder || product.available) {
            return "Made to Order";
        }
        return "Out of Stock";
    }
    if (stock <= 5) {
        return `Only ${stock} left!`;
    }
    return "In Stock";
}

function getStockClass(product) {
    const stock = product.stock || 0;
    if (stock === 0 && !product.preOrder && !product.available) {
        return 'stock-out';
    }
    if (stock <= 5) {
        return 'stock-low';
    }
    return 'stock-in';
}

function canPurchase(product) {
    return product.available !== false && (product.stock > 0 || product.preOrder === true);
}

// ============================================
// 3. RANDOM SELECTION HELPER
// ============================================
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
        <div class="product-card" data-product-id="${product.id}" data-aos="fade-up">
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
// 5. CART & CHECKOUT FUNCTIONS
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

function getCurrentFilterCategory() {
    const activeBtn = document.querySelector('.filter-btn.active');
    if (!activeBtn) return 'all';

    const onclick = activeBtn.getAttribute('onclick');
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
// 8. 3D TILT EFFECT
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
// 9. INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('product-container')) {
        renderProducts('all');
    }
});