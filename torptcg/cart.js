// ============================================
// SHOPPING CART MANAGEMENT
// ============================================

// Cart state - stored in localStorage
let cart = JSON.parse(localStorage.getItem('torptcg_cart')) || [];

// ============================================
// CART UI FUNCTIONS
// ============================================

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');

    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');

    // Update cart display when opening
    if (sidebar.classList.contains('open')) {
        renderCart();
    }
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems > 0) {
        badge.textContent = totalItems;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Clear current items
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
                <p>Your cart is empty</p>
            </div>
        `;
        cartTotal.textContent = '£0.00';
        checkoutBtn.disabled = true;
        return;
    }

    // Render cart items
    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="cart-item-image">
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.title}</h4>
                <div class="cart-item-price">£${item.price.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="qty-btn" onclick="updateCartQuantity('${item.id}', -1)">−</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateCartQuantity('${item.id}', 1)">+</button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" title="Remove item">×</button>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    // Calculate and display total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `£${total.toFixed(2)}`;
    checkoutBtn.disabled = false;
}

// ============================================
// CART MANAGEMENT FUNCTIONS
// ============================================

async function addToCart(product) {
    // Validate stock availability
    const currentStock = product.stock || 0;
    const existingItem = cart.find(item => item.id === product.id);
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;

    // Check if we can add one more
    if (currentCartQuantity >= currentStock) {
        showStockLimitNotification(product.title, currentStock);
        // Shake the cart icon
        shakeCartIcon();
        return false;
    }

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: typeof product.price === 'number' ? product.price : parseFloat(product.price.replace('£', '')),
            image: product.image,
            quantity: 1,
            category: product.category,
            maxStock: currentStock
        });
    }

    // Save to localStorage
    saveCart();

    // Update UI
    updateCartBadge();

    // Show success notification
    showCartNotification(`Added ${product.title} to cart`);

    return true;
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartBadge();
    renderCart();

    showCartNotification('Item removed from cart');
}

async function updateCartQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);

    if (item) {
        const newQuantity = item.quantity + change;

        // Remove if quantity is 0 or less
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        // Fetch current stock to validate
        try {
            const products = await fetchProducts();
            const product = products.find(p => p.id === productId);

            if (product) {
                const currentStock = product.stock || 0;

                // Check if new quantity exceeds stock
                if (newQuantity > currentStock) {
                    showStockLimitNotification(item.title, currentStock);
                    shakeCartItem(productId);
                    return;
                }

                // Update max stock in cart item
                item.maxStock = currentStock;
            }
        } catch (error) {
            console.error('Error fetching stock:', error);
        }

        item.quantity = newQuantity;
        saveCart();
        updateCartBadge();
        renderCart();
    }
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartBadge();
    renderCart();
}

function saveCart() {
    localStorage.setItem('torptcg_cart', JSON.stringify(cart));
}

// ============================================
// CHECKOUT FUNCTIONS
// ============================================

async function proceedToCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }

    // Disable checkout button to prevent double-clicks
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Processing...';
    }

    try {
        // Call Netlify function to create Stripe Checkout session
        const response = await fetch('/.netlify/functions/create-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items: cart }),
        });

        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }

        const { url } = await response.json();

        // Redirect to Stripe Checkout
        window.location.href = url;

    } catch (error) {
        console.error('Checkout error:', error);
        alert('There was an error processing your checkout. Please try again.');

        // Re-enable checkout button
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Proceed to Checkout';
        }
    }
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

function showCartNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--bg-card);
        border: 1px solid var(--primary);
        border-radius: 8px;
        padding: 15px 20px;
        color: var(--text-main);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10002;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Stock limit notification
function showStockLimitNotification(productTitle, maxStock) {
    const message = maxStock === 0
        ? `Sorry! "${productTitle}" is out of stock.`
        : `Sorry! We only have ${maxStock} of "${productTitle}" available.`;

    // Create notification element with warning styling
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--bg-card);
        border: 2px solid #ff7675;
        border-radius: 8px;
        padding: 15px 20px;
        color: var(--text-main);
        box-shadow: 0 4px 12px rgba(255, 118, 117, 0.4);
        z-index: 10002;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 4 seconds (longer for error messages)
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Shake cart icon animation
function shakeCartIcon() {
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            cartIcon.style.animation = '';
        }, 500);
    }
}

// Shake cart item animation
function shakeCartItem(productId) {
    const cartItems = document.querySelectorAll('.cart-item');
    cartItems.forEach(item => {
        const removeBtn = item.querySelector(`[onclick*="'${productId}'"]`);
        if (removeBtn) {
            item.style.animation = 'shake 0.5s ease';
            setTimeout(() => {
                item.style.animation = '';
            }, 500);
        }
    });
}

// Add notification animations to the page
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// ============================================
// INITIALIZE CART ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();

    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('cart-sidebar');
        const cartIcon = document.querySelector('.cart-icon');

        if (sidebar && sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            !cartIcon.contains(e.target) &&
            !e.target.classList.contains('cart-overlay')) {
            // Don't close if clicking inside sidebar
            return;
        }
    });
});

// ============================================
// EXPORT FOR USE IN OTHER SCRIPTS
// ============================================

// Make functions globally available
window.toggleCart = toggleCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.proceedToCheckout = proceedToCheckout;
window.clearCart = clearCart;
