const { test, expect } = require('@playwright/test');

test.describe('Visual Responsiveness', () => {

    test('Desktop view - Product Grid should have multiple columns', async ({ page }) => {
        // Set viewport to Desktop
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto('/');

        // Wait for products to load
        await page.waitForSelector('.product-card', { timeout: 10000 });

        // Check grid layout styles
        const productGrid = page.locator('.product-grid').first();
        const gridTemplateColumns = await productGrid.evaluate(el =>
            window.getComputedStyle(el).gridTemplateColumns
        );

        // Should have multiple columns (e.g., '280px 280px 280px 280px' or similar depending on screen width)
        console.log('Desktop grid columns:', gridTemplateColumns);
        expect(gridTemplateColumns.split(' ').length).toBeGreaterThan(1);
    });

    test('Mobile view - Product Grid should be single column or responsive', async ({ page }) => {
        // Set viewport to Mobile
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        // Wait for products to load
        await page.waitForSelector('.product-card', { timeout: 10000 });

        // Check grid layout styles
        const productGrid = page.locator('.product-grid').first();
        const gridTemplateColumns = await productGrid.evaluate(el =>
            window.getComputedStyle(el).gridTemplateColumns
        );

        console.log('Mobile grid columns:', gridTemplateColumns);

        // Verify no horizontal scrolling on body
        const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const clientWidth = await page.evaluate(() => document.body.clientWidth);

        // Allow a small buffer for scrollbars
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

        // Visual check for squashed cards (user reported issue)
        // Check width of a card relative to viewport
        const card = page.locator('.product-card').first();
        const cardBox = await card.boundingBox();

        if (cardBox) {
            console.log(`Mobile Viewport Width: 375, Card Width: ${cardBox.width}`);
            // If card is significantly smaller than expected or squashed
            // Usually card should take up most of the width minus padding/gap
            expect(cardBox.width).toBeGreaterThan(250);
        }
    });

    test('Mobile view - Check for squashed cards via Aspect Ratio', async ({ page }) => {
        // Set viewport to Mobile
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        await page.waitForSelector('.product-card', { timeout: 10000 });

        // Filter to singles to check card aspect ratio
        await page.click('button:has-text("Singles")');
        await page.waitForTimeout(1000); // Wait for filter animation/render

        const card = page.locator('.product-card.single-card').first();
        const cardBox = await card.boundingBox();

        if (cardBox) {
            const aspectRatio = cardBox.width / cardBox.height;
            console.log(`Mobile Card Dimensions: ${cardBox.width}x${cardBox.height}, Ratio: ${aspectRatio}`);

            // Standard card aspect ratio is ~0.71 (2.5/3.5)
            // If it's squashed horizontally, ratio might be lower, or if height is fixed and width shrinks.
            // If user says "squashed on mobile", it might mean width is too small or ratio is distorted.

            // Let's assert it is close to expected ratio
            expect(aspectRatio).toBeCloseTo(2.5/3.5, 1); // Generous precision for now
        }
    });
});
