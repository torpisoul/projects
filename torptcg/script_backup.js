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
        // Handle both array and object with products property
        const products = Array.isArray(data) ? data : (data.products || []);
        return products;
    } catch (error) {
        console.error('Error loading inventory:', error);
        return getFallbackProducts();
    }
}

// Update stock for a product (for checkout/purchase)
async function updateStock(productId, quantity) {
    try {
        const response = await fetch('/.netlify/functions/inventory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: productId,
                delta: -quantity // Negative for purchase
            })
        });

        const result = await response.json();

        if (!response.ok) {
            if (response.status === 409) {
                // Insufficient stock
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

// Fallback products if the inventory system is not available
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

// Get stock status text
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

// Get stock badge class for styling
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

// Check if product can be purchased
function canPurchase(product) {
    return product.available !== false && (product.stock > 0 || product.preOrder === true);
}

// ============================================
// 3. RANDOM SELECTION HELPER
// ============================================

function getRandomItems(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// ============================================
// 4. RENDER FUNCTIONS
// ============================================

// Render products by category sections (initial view)
async function renderProductsByCategory() {
    const container = document.getElementById('product-container');
    if (!container) return;

    container.classList.remove('card-gallery-grid');
    container.classList.add('product-grid');
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Loading products...</div>';

    const allProducts = await fetchProducts();

    // Filter based on out-of-stock toggle
    const products = showOutOfStock ? allProducts : allProducts.filter(p => p.stock > 0 || p.preOrder);

    const categories = [
        { id: 'singles', name: 'Singles', count: 3 },
        { id: 'sealed', name: 'Sealed Product', count: 3 },
        { id: 'accessories', name: 'Accessories', count: 3 },
        { id: 'prints', name: '3D Prints', count: 3 }
    ];

    container.innerHTML = '';

    categories.forEach(cat => {
        const categoryProducts = products.filter(p => p.category === cat.id);
        if (categoryProducts.length === 0) return;

        const randomSelection = getRandomItems(categoryProducts, cat.count);

        const section = document.createElement('div');
        section.className = 'category-section';
        section.innerHTML = `
            <div class="category-header">
                <h3>${cat.name}</h3>
                <button class="view-all-btn" onclick="filterProducts('${cat.id}')">View All ${cat.name}</button>
            </div>
            <div class="product-grid" id="category-${cat.id}"></div>
        `;

        container.appendChild(section);

        const categoryContainer = document.getElementById(`category-${cat.id}`);
        randomSelection.forEach(product => {
            const cardHTML = createProductCard(product);
            categoryContainer.innerHTML += cardHTML;
        });
    });

    // Re-initialize tilt effect
    setTimeout(initTiltEffect, 100);
}

// Render products to the DOM (filtered view)
async function renderProducts(filter = 'all') {
    const container = document.getElementById('product-container');
    if (!container) return;

    container.classList.remove('card-gallery-grid');
    container.classList.add('product-grid');
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Loading products...</div>';

    const allProducts = await fetchProducts();

    // Filter based on out-of-stock toggle
    let products = showOutOfStock ? allProducts : allProducts.filter(p => p.stock > 0 || p.preOrder);

    const filteredProducts = filter === 'all'
        ? products
        : products.filter(p => p.category === filter);

    container.innerHTML = '';

    if (filteredProducts.length === 0) {
        container.innerHTML = '<div class="no-results">No products found in this category.</div>';
        return;
    }

    filteredProducts.forEach(product => {
        const cardHTML = createProductCard(product);
        container.innerHTML += cardHTML;
    });

    // Re-initialize tilt effect
    setTimeout(initTiltEffect, 100);
}

// Create product card HTML
function createProductCard(product) {
    const stockStatus = getStockStatus(product);
    const stockClass = getStockClass(product);
    const purchasable = canPurchase(product);
    const priceDisplay = typeof product.price === 'number' ? `Â£${product.price.toFixed(2)}` : product.price;

    // Determine button text and action
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

// Helper to get nice category names
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

// Handle add to cart with stock validation
async function handleAddToCart(productId) {
    // Fetch current inventory to validate stock
    const products = await fetchProducts();
    const product = products.find(p => p.id === productId);

    if (!product) {
        alert('Product not found. Please refresh the page.');
        return;
    }

    if (result.success) {
        alert('âœ… Added to cart! Stock updated.');
        // Refresh the product display
        const currentFilter = getCurrentFilterCategory();
        if (currentFilter === 'all-categories') {
            renderProductsByCategory();
        } else {
            renderProducts(currentFilter);
        }
    } else {
        if (result.error === 'insufficient_stock') {
            alert('âŒ Sorry, this item is now out of stock. The page will refresh.');
            const currentFilter = getCurrentFilterCategory();
            if (currentFilter === 'all-categories') {
                renderProductsByCategory();
            } else {
                renderProducts(currentFilter);
            }
        } else {
            alert('âŒ Unable to add to cart. Please try again.');
        }
    }
}
}

