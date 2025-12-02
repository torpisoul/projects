// ============================================
// CARD GALLERY - SEARCH & FILTER SYSTEM
// ============================================

let allCards = [];
let filteredCards = [];

// Image cache for CDN images
const imageCache = new Map();

// ============================================
// 1. FETCH CARDS FROM JSONBIN
// ============================================

async function fetchCards() {
    try {
        const response = await fetch('/.netlify/functions/cards');
        if (!response.ok) {
            console.error('Failed to fetch cards:', response.status);
            return [];
        }

        const data = await response.json();

        // Handle the nested structure from card-gallery.json
        let cards = [];
        if (data.page && data.page.cards && data.page.cards.items) {
            cards = data.page.cards.items;
        } else {
            cards = Array.isArray(data) ? data : (data.cards || []);
        }

        // Fetch inventory and merge
        try {
            const inventoryResponse = await fetch('/.netlify/functions/card-inventory');
            if (inventoryResponse.ok) {
                const inventory = await inventoryResponse.json();

                // Create inventory map
                const inventoryMap = {};
                inventory.forEach(item => {
                    inventoryMap[item.cardId] = item.stock;
                });

                // Merge stock data into cards
                cards = cards.map(card => ({
                    ...card,
                    stock: inventoryMap[card.id] !== undefined ? inventoryMap[card.id] : null
                }));
            }
        } catch (invError) {
            console.warn('Could not fetch inventory, cards will show without stock:', invError);
        }

        return cards;
    } catch (error) {
        console.error('Error fetching cards:', error);
        return [];
    }
}

// ============================================
// 2. IMAGE CACHING SYSTEM
// ============================================

/**
 * Preload and cache an image from CDN
 * @param {string} url - Image URL
 * @returns {Promise<string>} - Returns the URL when loaded
 */
function cacheImage(url) {
    if (imageCache.has(url)) {
        return Promise.resolve(url);
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            imageCache.set(url, true);
            resolve(url);
        };
        img.onerror = () => {
            console.warn('Failed to cache image:', url);
            resolve(url); // Still resolve to allow display
        };
        img.src = url;
    });
}

/**
 * Batch cache multiple images
 * @param {Array<string>} urls - Array of image URLs
 */
async function batchCacheImages(urls) {
    const uniqueUrls = [...new Set(urls)];
    const promises = uniqueUrls.map(url => cacheImage(url));
    await Promise.allSettled(promises);
    console.log(`Cached ${imageCache.size} images`);
}

// ============================================
// 3. SEARCH & FILTER LOGIC
// ============================================

/**
 * Extract searchable text from HTML
 */
function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

/**
 * Fuzzy search - checks if search term appears in text
 */
function fuzzyMatch(text, search) {
    if (!search) return true;
    if (!text) return false;
    return text.toLowerCase().includes(search.toLowerCase());
}

/**
 * Apply all filters to cards
 */
function applyFilters() {
    const filters = {
        name: document.getElementById('search-name').value.trim(),
        id: document.getElementById('search-id').value.trim(),
        ability: document.getElementById('search-ability').value.trim(),
        energyMin: parseInt(document.getElementById('energy-min').value) || null,
        energyMax: parseInt(document.getElementById('energy-max').value) || null,
        mightMin: parseInt(document.getElementById('might-min').value) || null,
        mightMax: parseInt(document.getElementById('might-max').value) || null,
        type: document.getElementById('filter-type').value,
        rarity: document.getElementById('filter-rarity').value,
        domain: document.getElementById('filter-domain').value,
        set: document.getElementById('filter-set').value
    };

    filteredCards = allCards.filter(card => {
        // Name filter
        if (filters.name && !fuzzyMatch(card.name, filters.name)) {
            return false;
        }

        // ID/Public Code filter (fuzzy - typing "56" should match "ogn-056-298")
        if (filters.id) {
            const idMatch = fuzzyMatch(card.id, filters.id) ||
                fuzzyMatch(card.publicCode, filters.id) ||
                fuzzyMatch(String(card.collectorNumber), filters.id);
            if (!idMatch) return false;
        }

        // Ability text filter
        if (filters.ability) {
            const abilityText = card.text?.richText?.body ? stripHtml(card.text.richText.body) : '';
            if (!fuzzyMatch(abilityText, filters.ability)) {
                return false;
            }
        }

        // Energy range filter
        const energy = card.energy?.value?.id;
        if (energy !== undefined) {
            if (filters.energyMin !== null && energy < filters.energyMin) return false;
            if (filters.energyMax !== null && energy > filters.energyMax) return false;
        }

        // Might range filter
        const might = card.might?.value?.id;
        if (might !== undefined) {
            if (filters.mightMin !== null && might < filters.mightMin) return false;
            if (filters.mightMax !== null && might > filters.mightMax) return false;
        }

        // Type filter
        if (filters.type) {
            const cardType = card.cardType?.type?.[0]?.id;
            if (cardType !== filters.type) return false;
        }

        // Rarity filter
        if (filters.rarity) {
            const rarity = card.rarity?.value?.id;
            if (rarity !== filters.rarity) return false;
        }

        // Domain filter
        if (filters.domain) {
            const domains = card.domain?.values || [];
            const hasDomain = domains.some(d => d.id === filters.domain);
            if (!hasDomain) return false;
        }

        // Set filter
        if (filters.set) {
            const cardSet = card.set?.value?.id;
            if (cardSet !== filters.set) return false;
        }

        return true;
    });

    renderCards();
    updateResultsCount();
}

/**
 * Reset all filters
 */
function resetFilters() {
    document.getElementById('search-name').value = '';
    document.getElementById('search-id').value = '';
    document.getElementById('search-ability').value = '';
    document.getElementById('energy-min').value = '';
    document.getElementById('energy-max').value = '';
    document.getElementById('might-min').value = '';
    document.getElementById('might-max').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-rarity').value = '';
    document.getElementById('filter-domain').value = '';
    document.getElementById('filter-set').value = '';

    filteredCards = [...allCards];
    renderCards();
    updateResultsCount();
}

/**
 * Update results count display
 */
/**
 * Get stock status class and label
 */
function getCardStockStatus(card) {
    const stock = card.stock !== undefined ? card.stock : null;

    if (stock === null) {
        return { class: '', label: '' }; // No stock data
    }

    if (stock === 0) {
        return { class: 'stock-out', label: 'Out of Stock' };
    } else if (stock <= 3) {
        return { class: 'stock-low', label: `${stock} in stock` };
    } else {
        return { class: 'stock-in', label: 'In Stock' };
    }
}

/**
 * Create a card DOM element
 */
function createCardElement(card) {
    const div = document.createElement('div');
    div.className = 'card-item';

    // Extract data
    const name = card.name || 'Unknown';
    const imageUrl = card.cardImage?.url || '';
    const cardType = card.cardType?.type?.[0]?.label || 'Unknown';
    const rarity = card.rarity?.value?.label || '';
    const domain = card.domain?.values?.[0]?.label || '';
    const energy = card.energy?.value?.id;
    const might = card.might?.value?.id;
    const publicCode = card.publicCode || card.id;
    const stockStatus = getCardStockStatus(card);

    // Build HTML
    div.innerHTML = `
        <div class="card-image-container">
            <img src="${imageUrl}" alt="${name}" loading="lazy">
            ${stockStatus.label ? `<div class="card-stock-badge ${stockStatus.class}">${stockStatus.label}</div>` : ''}
        </div>
        <div class="card-info">
            <h3 class="card-name">${name}</h3>
            <div class="card-meta">
                ${cardType ? `<span class="card-badge badge-type">${cardType}</span>` : ''}
                ${rarity ? `<span class="card-badge badge-rarity">${rarity}</span>` : ''}
                ${domain ? `<span class="card-badge badge-domain">${domain}</span>` : ''}
            </div>
            ${(energy !== undefined || might !== undefined) ? `
                <div class="card-stats">
                    ${energy !== undefined ? `
                        <div class="stat-item">
                            <span class="stat-label">Energy:</span>
                            <span class="stat-value">${energy}</span>
                        </div>
                    ` : ''}
                    ${might !== undefined ? `
                        <div class="stat-item">
                            <span class="stat-label">Might:</span>
                            <span class="stat-value">${might}</span>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            <div class="card-code">${publicCode}</div>
        </div>
    `;

    return div;
}

// ============================================
// 5. INITIALIZATION
// ============================================

let isCardSearchInitialized = false;

async function initCardSearch() {
    if (isCardSearchInitialized) {
        renderCards();
        return;
    }

    console.log('Initializing card gallery...');

    // Fetch cards
    allCards = await fetchCards();
    filteredCards = [...allCards];

    console.log(`Loaded ${allCards.length} cards`);

    // Render initial cards
    renderCards();
    updateResultsCount();

    // Cache all card images in the background
    const imageUrls = allCards
        .map(card => card.cardImage?.url)
        .filter(url => url);

    batchCacheImages(imageUrls).then(() => {
        console.log('All card images cached for faster browsing');
    });

    // Set up event listeners
    const applyBtn = document.getElementById('apply-card-filters');
    if (applyBtn) applyBtn.addEventListener('click', applyFilters);

    const resetBtn = document.getElementById('reset-card-filters');
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);

    // Real-time search on Enter key
    const searchInputs = [
        'search-name', 'search-id', 'search-ability',
        'energy-min', 'energy-max', 'might-min', 'might-max'
    ];

    searchInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    applyFilters();
                }
            });
        }
    });

    // Auto-apply on dropdown change
    const dropdowns = ['filter-type', 'filter-rarity', 'filter-domain'];
    dropdowns.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.addEventListener('change', applyFilters);
        }
    });

    // Toggle search panel - removed as this is now handled in script.js

    isCardSearchInitialized = true;
}

// Update renderCards to target product-container
function renderCards() {
    const container = document.getElementById('product-container');
    if (!container) return;

    container.classList.add('card-gallery-grid');

    if (filteredCards.length === 0) {
        container.innerHTML = '<div class="no-results">No cards found matching your filters.</div>';
        return;
    }

    container.innerHTML = '';

    filteredCards.forEach(card => {
        const cardEl = createCardElement(card);
        container.appendChild(cardEl);
    });
}

// Update updateResultsCount to target card-results-count
function updateResultsCount() {
    const countEl = document.getElementById('card-results-count');
    if (countEl) {
        countEl.textContent = `Showing ${filteredCards.length} of ${allCards.length} cards`;
    }
}

// Expose to window
window.initCardSearch = initCardSearch;
window.renderCards = renderCards;
