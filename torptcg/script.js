// 1. FETCH PRODUCTS FROM MARKDOWN FILES
async function fetchProducts() {
    try {
        // Fetch the products directory listing
        const response = await fetch('/products-data.json');
        if (!response.ok) {
            console.warn('Products data file not found, using fallback data');
            return getFallbackProducts();
        }
        const products = await response.json();
        return products;
    } catch (error) {
        console.error('Error loading products:', error);
        return getFallbackProducts();
    }
}

// Fallback products if the JSON file doesn't exist yet
function getFallbackProducts() {
    return [
        {
            id: 1,
            title: "Riftbound: Origins Booster Box",
            category: "sealed",
            price: "£120.00",
            image: "https://images.unsplash.com/photo-1620336655055-088d06e36bf0?auto=format&fit=crop&w=400&q=80",
            stock: "In Stock"
        },
        {
            id: 2,
            title: "Void Walker (Ultra Rare)",
            category: "singles",
            price: "£45.00",
            image: "https://images.unsplash.com/photo-1601987177651-8edfe6c20009?auto=format&fit=crop&w=400&q=80",
            stock: "Low Stock"
        },
        {
            id: 3,
            title: "Custom Resin Deck Box (Dragon)",
            category: "prints",
            price: "£35.00",
            image: "https://images.unsplash.com/photo-1615815707923-2d1d9a637276?auto=format&fit=crop&w=400&q=80",
            stock: "Made to Order"
        },
        {
            id: 4,
            title: "Riftbound Starter Deck: Aether",
            category: "sealed",
            price: "£14.99",
            image: "https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb?auto=format&fit=crop&w=400&q=80",
            stock: "In Stock"
        },
        {
            id: 5,
            title: "Chibi Voidling Plushie",
            category: "accessories",
            price: "£18.00",
            image: "https://images.unsplash.com/photo-1559479014-48e5da45043b?auto=format&fit=crop&w=400&q=80",
            stock: "In Stock"
        },
        {
            id: 6,
            title: "Bespoke Hero Miniature (Painted)",
            category: "prints",
            price: "£50.00",
            image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=400&q=80",
            stock: "Made to Order"
        }
    ];
}

// 2. CORE FUNCTIONS

// Render products to the DOM
async function renderProducts(filter = 'all') {
    const container = document.getElementById('product-container');
    if (!container) return; // Guard clause for admin page

    container.innerHTML = '<div style="text-align: center; padding: 40px;">Loading products...</div>';

    const products = await fetchProducts();

    const filteredProducts = filter === 'all'
        ? products
        : products.filter(p => p.category === filter);

    container.innerHTML = '';

    if (filteredProducts.length === 0) {
        container.innerHTML = '<div class="no-results">No products found in this category.</div>';
        return;
    }

    filteredProducts.forEach(product => {
        const cardHTML = `
            <div class="product-card" data-aos="fade-up">
                <div class="card-image-wrapper">
                    <img src="${product.image}" alt="${product.title}" class="product-image">
                    <span class="category-tag">${getCategoryName(product.category)}</span>
                </div>
                <div class="product-details">
                    <div class="stock-badge ${getStockClass(product.stock)}">${product.stock}</div>
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-price">${product.price}</div>
                    <button class="btn-add">Add to Cart</button>
                </div>
            </div>
        `;
        container.innerHTML += cardHTML;
    });

    // Re-initialize tilt effect after products are rendered
    setTimeout(initTiltEffect, 100);
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

// Helper for stock classes
function getStockClass(stock) {
    if (stock.includes('Low')) return 'stock-low';
    if (stock.includes('Out')) return 'stock-out';
    return 'stock-in';
}

// 3. EVENT LISTENERS
function filterProducts(category) {
    // Update active button state
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Find the button that was clicked - handle both click event and direct call
    const buttons = document.querySelectorAll('.filter-btn');
    for (let btn of buttons) {
        const onclick = btn.getAttribute('onclick');
        if (onclick && onclick.includes(category)) {
            btn.classList.add('active');
            break;
        }
    }

    renderProducts(category);
}

// 3D Tilt Effect with Dynamic Holographic Shine
function initTiltEffect() {
    const cards = document.querySelectorAll('.product-card');

    cards.forEach(card => {
        // Create a style element for this specific card if it doesn't exist
        if (!card.dataset.styleId) {
            const styleId = 'card-style-' + Math.random().toString(36).substr(2, 9);
            card.dataset.styleId = styleId;
        }

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calculate percentages
            const xPct = x / rect.width;
            const yPct = y / rect.height;

            // Calculate rotation (reduced to 15 degrees for subtlety)
            const xRot = (0.5 - yPct) * 15; // Rotate X axis based on Y position
            const yRot = (xPct - 0.5) * 15; // Rotate Y axis based on X position

            // Apply 3D transform
            card.style.transform = `perspective(1000px) rotateX(${xRot}deg) rotateY(${yRot}deg) scale(1.05)`;

            // Update shine position to follow mouse
            const shineX = (xPct * 100).toFixed(0);
            const shineY = (yPct * 100).toFixed(0);

            // Dynamically update the ::before pseudo-element's gradient position
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

            // Reset shine to center
            const styleId = card.dataset.styleId;
            const styleEl = document.getElementById(styleId);
            if (styleEl) {
                styleEl.textContent = '';
            }
        });
    });
}

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('product-container')) {
        renderProducts('all');
    }
});