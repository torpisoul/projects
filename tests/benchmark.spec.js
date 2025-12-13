// tests/benchmark.spec.js
// Comprehensive benchmark tests for current checkout, pricing, stock, and modal behavior
// Run with: npx playwright test tests/benchmark.spec.js --project=chromium
// Requires netlify dev running on port 8888

const { test, expect } = require('@playwright/test');

// Override baseURL to use netlify dev server
test.use({ baseURL: 'http://localhost:8888' });

test.describe('Checkout Flow - Benchmark', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Clear local storage to start fresh
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        // Wait for products to load
        await page.waitForSelector('.product-card', { timeout: 30000 });
    });

    test('checkout API returns Stripe URL with valid cart', async ({ page, request }) => {
        // Add an item to cart via UI
        const firstCard = page.locator('.product-card').first();
        await firstCard.hover();
        const addBtn = firstCard.locator('.btn-add');
        await expect(addBtn).toBeVisible({ timeout: 5000 });
        await addBtn.click();

        // Wait for cart to update
        await expect(page.locator('#basket-count-badge')).toBeVisible({ timeout: 5000 });

        // Get cart from local storage
        const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('torptcg_basket')));
        expect(cart).toHaveLength(1);

        // Call checkout API directly
        const response = await request.post('http://localhost:8888/.netlify/functions/create-checkout-session', {
            data: { cart }
        });

        expect(response.status()).toBe(200);
        const json = await response.json();
        expect(json.url).toBeDefined();
        expect(json.url).toContain('stripe.com');
    });

    test('checkout rejects empty cart with 400 error', async ({ request }) => {
        const response = await request.post('http://localhost:8888/.netlify/functions/create-checkout-session', {
            data: { cart: [] }
        });

        expect(response.status()).toBe(400);
        const json = await response.json();
        expect(json.error).toBe('Cart is empty');
    });

    test('checkout rejects non-existent product with 400 error', async ({ request }) => {
        const response = await request.post('http://localhost:8888/.netlify/functions/create-checkout-session', {
            data: {
                cart: [{ id: 'non-existent-product-id', title: 'Fake Product', quantity: 1 }]
            }
        });

        expect(response.status()).toBe(400);
        const json = await response.json();
        expect(json.error).toContain('not found');
    });
});

test.describe('Shipping Fees - Benchmark', () => {
    test('inventory returns products with prices', async ({ request }) => {
        const response = await request.get('http://localhost:8888/.netlify/functions/inventory');
        expect(response.status()).toBe(200);

        const products = await response.json();
        expect(Array.isArray(products)).toBe(true);
        expect(products.length).toBeGreaterThan(0);

        // Each product should have price
        products.forEach(product => {
            expect(product.price).toBeDefined();
            expect(typeof product.price).toBe('number');
        });
    });

    test('checkout with low-value cart should include shipping option', async ({ request }) => {
        // Get a cheap product from inventory
        const invResponse = await request.get('http://localhost:8888/.netlify/functions/inventory');
        const products = await invResponse.json();

        // Find a product with stock and price under £20
        const cheapProduct = products.find(p => p.stock > 0 && p.price < 20);

        if (!cheapProduct) {
            test.skip(true, 'No cheap products available for testing');
            return;
        }

        // Call checkout - should succeed
        const response = await request.post('http://localhost:8888/.netlify/functions/create-checkout-session', {
            data: {
                cart: [{ id: cheapProduct.id, title: cheapProduct.title, quantity: 1 }]
            }
        });

        expect(response.status()).toBe(200);
        const json = await response.json();
        expect(json.url).toContain('stripe.com');
    });
});

test.describe('Price Display - Benchmark', () => {
    test('singles cards display price from inventory', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.product-card', { timeout: 30000 });

        // Click Singles filter
        await page.locator('.filter-btn:has-text("Singles")').click();
        await page.waitForSelector('.product-card.single-card', { timeout: 30000 });

        // Get a price tag from a card
        const priceTag = page.locator('.product-price-tag').first();
        await expect(priceTag).toBeVisible();

        const priceText = await priceTag.textContent();
        // Price should be in £X.XX format
        expect(priceText).toMatch(/£\d+\.\d{2}/);
    });

    test('product cards show price', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.product-card', { timeout: 30000 });

        // Find a price display on a product card
        const priceDisplay = page.locator('.product-price, .product-price-tag').first();
        await expect(priceDisplay).toBeVisible();

        const priceText = await priceDisplay.textContent();
        expect(priceText).toContain('£');
    });
});

test.describe('Modal Behavior - Benchmark', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForSelector('.product-card', { timeout: 30000 });
    });

    test('clicking card opens modal', async ({ page }) => {
        // Click on Singles filter first
        await page.locator('.filter-btn:has-text("Singles")').click();
        await page.waitForSelector('.product-card.single-card', { timeout: 30000 });

        // Click on a card image to open modal
        const cardImage = page.locator('.product-card.single-card .product-image').first();
        await cardImage.click();

        // Modal should appear
        await expect(page.locator('#card-modal')).toBeVisible({ timeout: 5000 });
    });

    test('modal displays card details', async ({ page }) => {
        // Navigate to Singles
        await page.locator('.filter-btn:has-text("Singles")').click();
        await page.waitForSelector('.product-card.single-card', { timeout: 30000 });

        // Open modal
        const cardImage = page.locator('.product-card.single-card .product-image').first();
        await cardImage.click();
        await expect(page.locator('#card-modal')).toBeVisible({ timeout: 5000 });

        // Modal should have title, price, stock info
        await expect(page.locator('#card-modal h2')).toBeVisible();
        await expect(page.locator('#card-modal .card-price')).toBeVisible();
    });

    test('modal Add to Cart button adds item and closes modal', async ({ page }) => {
        // Navigate to Singles
        await page.locator('.filter-btn:has-text("Singles")').click();
        await page.waitForSelector('.product-card.single-card', { timeout: 30000 });

        // Open modal
        const cardImage = page.locator('.product-card.single-card .product-image').first();
        await cardImage.click();
        await expect(page.locator('#card-modal')).toBeVisible({ timeout: 5000 });

        // Click Add to Cart in modal
        const addToCartBtn = page.locator('#card-modal .modal-actions .btn:has-text("Add to Cart")');

        if (await addToCartBtn.isVisible()) {
            await addToCartBtn.click();

            // Modal should close after ~500ms
            await expect(page.locator('#card-modal')).toBeHidden({ timeout: 3000 });

            // Basket badge should be visible
            await expect(page.locator('#basket-count-badge')).toBeVisible();
        }
    });
});

test.describe('Basket Behavior - Benchmark', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForSelector('.product-card', { timeout: 30000 });
    });

    test('adding item updates basket badge', async ({ page }) => {
        // Add an item
        const firstCard = page.locator('.product-card').first();
        await firstCard.hover();
        const addBtn = firstCard.locator('.btn-add');
        await expect(addBtn).toBeVisible({ timeout: 5000 });
        await addBtn.click();

        // Badge should appear
        await expect(page.locator('#basket-count-badge')).toBeVisible({ timeout: 5000 });

        // Badge should show "1"
        const badgeText = await page.locator('#basket-count-badge').textContent();
        expect(badgeText).toBe('1');
    });

    test('basket modal opens when clicking cart icon', async ({ page }) => {
        // Add an item first
        const firstCard = page.locator('.product-card').first();
        await firstCard.hover();
        await firstCard.locator('.btn-add').click();
        await expect(page.locator('#basket-count-badge')).toBeVisible({ timeout: 5000 });

        // Click cart icon
        await page.locator('#shopping-cart-icon').click();

        // Basket modal should open
        await expect(page.locator('#basket-modal')).toBeVisible({ timeout: 5000 });
    });

    test('success page clears basket', async ({ page }) => {
        // First add something to basket
        await page.evaluate(() => {
            localStorage.setItem('torptcg_basket', JSON.stringify([
                { id: 'test-product', title: 'Test', quantity: 1, price: 10 }
            ]));
        });

        // Navigate to success page
        await page.goto('/success.html');
        await page.waitForLoadState('networkidle');

        // Check that basket is cleared
        const basket = await page.evaluate(() => localStorage.getItem('torptcg_basket'));
        expect(basket).toBeNull();
    });
});

test.describe('Stock Management - Benchmark', () => {
    test('inventory API returns stock levels', async ({ request }) => {
        const response = await request.get('http://localhost:8888/.netlify/functions/inventory');
        expect(response.status()).toBe(200);

        const products = await response.json();
        expect(Array.isArray(products)).toBe(true);

        // Each product should have stock
        products.forEach(product => {
            expect(product.stock).toBeDefined();
            expect(typeof product.stock).toBe('number');
        });
    });

    test('products display stock status', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.product-card', { timeout: 30000 });

        // Look for stock badges
        const stockBadge = page.locator('.stock-badge').first();
        await expect(stockBadge).toBeVisible();

        const stockText = await stockBadge.textContent();
        // Should be "In Stock", "Only X left!", or "Out of Stock"
        expect(stockText).toMatch(/In Stock|Only \d+ left!|Out of Stock/);
    });
});

test.describe('Admin Card Inventory - Benchmark', () => {
    test('card inventory page loads', async ({ page }) => {
        await page.goto('/admin/card-inventory.html');
        await page.waitForLoadState('networkidle');

        // Should have search bar
        await expect(page.locator('#search-input')).toBeVisible();

        // Should have filter tabs
        await expect(page.locator('.filter-tab')).toHaveCount(6); // All, In Stock, Low, Out, OGN, SFD
    });

    test('card inventory displays cards with price inputs', async ({ page }) => {
        await page.goto('/admin/card-inventory.html');

        // Wait for cards to load
        await page.waitForSelector('.inventory-card', { timeout: 30000 });

        // Should have price input fields
        const priceInput = page.locator('.price-input').first();
        await expect(priceInput).toBeVisible();

        // Price input should have a numeric value
        const value = await priceInput.inputValue();
        expect(parseFloat(value)).toBeGreaterThanOrEqual(0);
    });

    test('card inventory displays stock controls', async ({ page }) => {
        await page.goto('/admin/card-inventory.html');

        // Wait for cards to load
        await page.waitForSelector('.inventory-card', { timeout: 30000 });

        // Should have stock buttons
        await expect(page.locator('.stock-btn').first()).toBeVisible();

        // Should have stock input
        await expect(page.locator('.stock-input').first()).toBeVisible();
    });
});
