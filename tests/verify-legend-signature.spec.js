import { test, expect } from '@playwright/test';

test('Verify Legend and Signature Spell Filters and Stock Logic', async ({ page }) => {
  // Mock JSONBin API calls
  await page.route('https://api.jsonbin.io/v3/b/*', async route => {
      const url = route.request().url();

      // Mock Master Inventory
      if (url.includes('692ed2dbae596e708f7e68f9')) {
          await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                  record: {
                      inventory: [
                          { productId: 'bullet-time', stock: 5, binId: 'mock-bin' }
                          // Note: battle-mistress is NOT in inventory, so it defaults to 0 stock
                      ]
                  }
              })
          });
          return;
      }

      // Mock Product/Card Bins
      await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
              record: {
                  page: {
                      cards: {
                          items: [
                              {
                                  id: 'battle-mistress',
                                  name: 'Battle Mistress',
                                  publicCode: 'OGN-001',
                                  stock: 0,
                                  cardImage: { url: 'https://via.placeholder.com/150' },
                                  category: 'singles',
                                  cardType: { type: [{ id: 'legend' }] }
                              },
                              {
                                  id: 'bullet-time',
                                  name: 'Bullet Time',
                                  publicCode: 'OGN-002',
                                  stock: 5,
                                  cardImage: { url: 'https://via.placeholder.com/150' },
                                  category: 'singles',
                                  cardType: { type: [{ id: 'spell' }], superType: [{ id: 'signature' }] }
                              }
                          ]
                      }
                  }
              }
          })
      });
  });

  // Go to home page
  await page.goto('/');

  // Navigate to Singles
  await page.click('button:has-text("Singles")');

  // Wait for products to load - increase timeout just in case
  await page.waitForSelector('.product-card', { timeout: 30000 });

  // Open the filter panel
  const showFiltersBtn = page.locator('#toggle-search');
  // It might be visible or not depending on screen size logic, but usually visible for Singles
  if (await showFiltersBtn.isVisible()) {
    await showFiltersBtn.click();
  }

  // Wait for filter panel
  await page.waitForSelector('#card-search-panel', { state: 'visible' });

  // 1. Check for new options in Type dropdown
  const typeSelect = page.locator('#filter-type');
  const options = await typeSelect.textContent();
  expect(options).toContain('Legend');
  expect(options).toContain('Signature Spell');

  // 2. Test Legend Filter
  await typeSelect.selectOption('legend');
  await page.click('#apply-card-filters');

  // Wait for filtering
  await page.waitForTimeout(2000);

  // Wait for results count to update from "Loading..."
  await expect(page.locator('#card-results-count')).not.toHaveText('Loading...', { timeout: 10000 });

  // Verify the count reflects the hidden items (should be 0 if all legends are OOS)
  const countText = await page.locator('#card-results-count').textContent();
  const visibleCards = await page.locator('.product-card:visible').count();

  console.log(`Count text: "${countText}", Visible cards: ${visibleCards}`);

  expect(countText).toContain(`Showing ${visibleCards}`);

  // Since "Battle Mistress" is not in inventory (verified via grep), it should be HIDDEN by default
  // because our new logic sets stock to 0 for missing Legends.
  let battleMistress = page.locator('.product-card:has-text("Battle Mistress")');

  // Check that it is hidden or not present
  // Note: if filteredCards is empty, it might show "No cards found"
  // If Battle Mistress is the only legend, and it's hidden, we might see "No cards found".
  // If there are other legends that ARE in stock, they would show.
  // Assuming Battle Mistress is a good test case.
  if (await battleMistress.count() > 0) {
      await expect(battleMistress).toBeHidden();
  } else {
      // It's not in the DOM at all, which is also fine (filtered out)
      // But we need to distinguish between "filtered out by type" and "filtered out by stock".
      // Wait, if it's filtered out by stock, it's not rendered.
  }

  // Now toggle "Show out-of-stock"
  // The toggle container is hidden by CSS !important, so we must unhide it to interact
  await page.evaluate(() => {
      const el = document.querySelector('.stock-toggle-container');
      if (el) el.setAttribute('style', 'display: flex !important;');
  });

  // The input might be hidden by CSS for the custom switch style, so click the slider
  await page.click('.toggle-slider');

  // Wait for re-render
  await page.waitForTimeout(2000);

  // Now it should be visible because we allowed out of stock
  // This verifies that the filter FOUND it, and the stock logic HID it previously.
  await expect(battleMistress).toBeVisible();

  // And it should have "Out of Stock" badge
  await expect(battleMistress.locator('.stock-badge')).toHaveText('Out of Stock');

  // 3. Test Signature Spell Filter
  // Change type to Signature Spell
  await typeSelect.selectOption('signature');
  await page.click('#apply-card-filters');

  await page.waitForTimeout(2000);

  // "Bullet Time" IS in Master Inventory (stock > 0), so it should be VISIBLE by default
  let bulletTime = page.locator('.product-card:has-text("Bullet Time")');
  await expect(bulletTime).toBeVisible();

  // Verify it does NOT have "Out of Stock" badge
  await expect(bulletTime.locator('.stock-badge')).not.toHaveText('Out of Stock');

  // We can't easily test OOS toggle here since Bullet Time is in stock.
  // But we verified stock hiding with Battle Mistress (Legend) earlier.

});
