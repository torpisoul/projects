// tests/checkout.spec.js
// Tests for the checkout flow - requires netlify dev running on port 8888
// Run with: npx playwright test tests/checkout.spec.js --project=chromium
const { test, expect } = require('@playwright/test');

// Override baseURL to use netlify dev server
test.use({ baseURL: 'http://localhost:8888' });

test.describe('Checkout Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Clear local storage to start fresh
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        // Wait for products to load - increase timeout for netlify dev
        await page.waitForSelector('.product-card', { timeout: 30000 });
    });

    test('should successfully call checkout API with items in cart', async ({ page, request }) => {
        // Add an item to cart via UI
        const firstCard = page.locator('.product-card').first();
        await firstCard.hover();

        // Wait for button to be visible after hover
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

        // Should return 200 with a Stripe URL
        expect(response.status()).toBe(200);
        const json = await response.json();
        expect(json.url).toBeDefined();
        expect(json.url).toContain('stripe.com');
    });

    test('should reject empty cart', async ({ request }) => {
        const response = await request.post('http://localhost:8888/.netlify/functions/create-checkout-session', {
            data: { cart: [] }
        });

        expect(response.status()).toBe(400);
        const json = await response.json();
        expect(json.error).toBe('Cart is empty');
    });

    test('should reject non-existent product', async ({ request }) => {
        const response = await request.post('http://localhost:8888/.netlify/functions/create-checkout-session', {
            data: {
                cart: [{ id: 'non-existent-product-id', title: 'Fake Product', quantity: 1 }]
            }
        });

        expect(response.status()).toBe(400);
        const json = await response.json();
        expect(json.error).toContain('not found');
    });

    test('checkout button should trigger checkout flow', async ({ page }) => {
        // Add an item to cart
        const firstCard = page.locator('.product-card').first();
        await firstCard.hover();

        const addBtn = firstCard.locator('.btn-add');
        await expect(addBtn).toBeVisible({ timeout: 5000 });
        await addBtn.click();

        // Open basket modal
        await page.locator('#shopping-cart-icon').click();
        await expect(page.locator('#basket-modal')).toBeVisible();

        // Find and click checkout button
        const checkoutBtn = page.locator('#checkout-btn, .checkout-btn, button:has-text("Checkout")').first();

        // Listen for navigation to Stripe
        const [response] = await Promise.all([
            page.waitForResponse(resp => resp.url().includes('create-checkout-session'), { timeout: 10000 }),
            checkoutBtn.click()
        ]);

        // Verify the checkout API was called successfully
        expect(response.status()).toBe(200);
    });
});
