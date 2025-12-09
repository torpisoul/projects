// ============================================
// SHOPPING BASKET LOGIC
// ============================================

const BASKET_STORAGE_KEY = 'torptcg_basket';

// Initialize basket from local storage
let basket = JSON.parse(localStorage.getItem(BASKET_STORAGE_KEY)) || [];

/**
 * Save basket to local storage
 */
function saveBasket() {
    localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(basket));
    updateBasketCount();
}

/**
 * Add item to basket
 */
function addToBasket(product, quantity = 1) {
    const existingItem = basket.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        basket.push({
            id: product.id,
            title: product.title || product.name,
            price: product.price,
            image: product.image || (product.cardImage ? product.cardImage.url : ''),
            quantity: quantity,
            maxStock: product.stock // Track max stock available at time of adding
        });
    }

    saveBasket();

    // Show feedback
    showToast(`Added ${product.title || product.name} to basket`);
}

/**
 * Remove item from basket
 */
function removeFromBasket(productId) {
    basket = basket.filter(item => item.id !== productId);
    saveBasket();
    renderBasket(); // Re-render if open
}

/**
 * Update item quantity
 */
function updateBasketQuantity(productId, newQuantity) {
    const item = basket.find(i => i.id === productId);
    if (!item) return;

    if (newQuantity <= 0) {
        removeFromBasket(productId);
        return;
    }

    // Optional: Check against maxStock if we want to enforce strictly
    // but usually we validate at checkout.
    // For UI niceness:
    /*
    if (item.maxStock && newQuantity > item.maxStock) {
        alert(`Sorry, only ${item.maxStock} available.`);
        item.quantity = item.maxStock;
    } else {
        item.quantity = newQuantity;
    }
    */

    item.quantity = newQuantity;
    saveBasket();
    renderBasket();
}

/**
 * Get total items count
 */
function getBasketCount() {
    return basket.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Get total price
 */
function getBasketTotal() {
    return basket.reduce((total, item) => total + (item.price * item.quantity), 0);
}

/**
 * Clear basket
 */
function clearBasket() {
    basket = [];
    saveBasket();
    renderBasket();
}

/**
 * Update the UI count badge
 */
function updateBasketCount() {
    const count = getBasketCount();
    const badge = document.getElementById('basket-count');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

/**
 * Show a toast notification
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// BASKET UI RENDERER
// ============================================

function openBasketModal() {
    const modal = document.getElementById('basket-modal');
    if (!modal) return;

    renderBasket();
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
    document.body.style.overflow = 'hidden';
}

function closeBasketModal(event) {
    const modal = document.getElementById('basket-modal');
    if (!modal) return;

    if (event && event.target !== modal && !event.target.classList.contains('close-basket')) {
        return;
    }

    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
    document.body.style.overflow = '';
}

function renderBasket() {
    const container = document.getElementById('basket-items');
    const footer = document.getElementById('basket-footer');

    if (!container || !footer) return;

    container.innerHTML = '';

    if (basket.length === 0) {
        container.innerHTML = '<div class="empty-basket">Your basket is empty.</div>';
        footer.style.display = 'none';
        return;
    }

    footer.style.display = 'block';

    basket.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'basket-item';
        itemEl.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="basket-item-image">
            <div class="basket-item-details">
                <div class="basket-item-title">${item.title}</div>
                <div class="basket-item-price">£${item.price.toFixed(2)}</div>
                <div class="basket-controls">
                    <button onclick="updateBasketQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateBasketQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    <button class="remove-btn" onclick="removeFromBasket('${item.id}')">Remove</button>
                </div>
            </div>
        `;
        container.appendChild(itemEl);
    });

    const subtotalEl = document.getElementById('basket-subtotal');
    if (subtotalEl) {
        subtotalEl.textContent = `£${getBasketTotal().toFixed(2)}`;
    }
}

async function handleCheckout() {
    const btn = document.getElementById('checkout-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Processing...';
    }

    try {
        const response = await fetch('/.netlify/functions/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cart: basket })
        });

        const result = await response.json();

        if (response.ok && result.url) {
            window.location.href = result.url;
        } else {
            alert('Checkout failed: ' + (result.error || 'Unknown error'));
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Checkout via Stripe';
            }
        }
    } catch (error) {
        console.error('Checkout error:', error);
        alert('An error occurred. Please try again.');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Checkout via Stripe';
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    updateBasketCount();
});
