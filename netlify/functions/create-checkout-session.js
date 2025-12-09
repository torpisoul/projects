// Netlify Function: create-checkout-session
// Handles Stripe Checkout Session creation with stock validation AND price verification

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { fetchBin } = require('./bin-fetcher');

let config = {};
try {
    config = require('./config.js');
} catch (e) {
    // config.js not found, rely on process.env
}

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY || config.JSONBIN_API_KEY;
const MASTER_INVENTORY_BIN_ID = process.env.MASTER_INVENTORY_BIN_ID || config.MASTER_INVENTORY_BIN_ID;

const DOMAIN = process.env.URL || 'http://localhost:8888';

exports.handler = async function (event, context) {
    console.log('[CHECKOUT] Function invoked');

    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('[CHECKOUT] STRIPE_SECRET_KEY missing');
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Stripe configuration error' }) };
    }

    try {
        const { cart } = JSON.parse(event.body);

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Cart is empty' }) };
        }

        console.log(`[CHECKOUT] Processing ${cart.length} items`);

        // 1. Fetch Master Inventory to get bin locations and stock
        const masterData = await fetchBin(MASTER_INVENTORY_BIN_ID, JSONBIN_API_KEY);
        const inventory = masterData.inventory || [];

        // Map: productId -> { stock, binId }
        const inventoryMap = {};
        inventory.forEach(item => {
            inventoryMap[item.productId] = {
                stock: item.stock,
                binId: item.binId
            };
        });

        // 2. Group items by their source bin to minimize API calls
        // Map: binId -> [productId, productId, ...]
        const binGroups = {};
        const itemsNeedingVerification = [];

        for (const item of cart) {
            const invData = inventoryMap[item.id];

            // Check existence and stock
            if (!invData) {
                 return { statusCode: 404, headers, body: JSON.stringify({ error: `Product ${item.id} not found in inventory` }) };
            }

            if (invData.stock < item.quantity) {
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({
                        error: `Insufficient stock for ${item.title}. Available: ${invData.stock}, Requested: ${item.quantity}`
                    })
                };
            }

            // Add to verification group
            if (invData.binId) {
                if (!binGroups[invData.binId]) {
                    binGroups[invData.binId] = [];
                }
                binGroups[invData.binId].push(item.id);
                itemsNeedingVerification.push({ ...item, binId: invData.binId });
            } else {
                 console.warn(`[CHECKOUT] Item ${item.id} has no binId in inventory, skipping price check (using client price)`);
                 itemsNeedingVerification.push({ ...item, skipPriceCheck: true });
            }
        }

        // 3. Fetch product bins and verify prices
        const priceMap = {}; // productId -> verifiedPrice

        const binPromises = Object.entries(binGroups).map(async ([binId, productIds]) => {
            try {
                const binData = await fetchBin(binId, JSONBIN_API_KEY);
                let products = [];

                // Handle various bin structures
                if (binData.products && Array.isArray(binData.products)) {
                    products = binData.products;
                } else if (Array.isArray(binData)) {
                    products = binData;
                } else if (binData.page && binData.page.cards && binData.page.cards.items) {
                    products = binData.page.cards.items;
                } else if (binData.cards && Array.isArray(binData.cards)) {
                    products = binData.cards;
                }

                // Find prices
                products.forEach(p => {
                    const pid = p.id || p.publicCode;
                    if (productIds.includes(pid)) {
                        priceMap[pid] = p.price;
                    }
                });
            } catch (err) {
                console.error(`[CHECKOUT] Failed to fetch bin ${binId} for verification:`, err);
            }
        });

        await Promise.all(binPromises);

        // 4. Build Stripe Line Items with Verified Prices
        const lineItems = [];
        const validCartItems = [];

        for (const item of itemsNeedingVerification) {
            let unitPrice = item.price; // Default to client price

            if (!item.skipPriceCheck) {
                const verifiedPrice = priceMap[item.id];
                if (verifiedPrice !== undefined) {
                    unitPrice = verifiedPrice;
                } else {
                    console.warn(`[CHECKOUT] Could not verify price for ${item.id}, using client price`);
                }
            }

            lineItems.push({
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: item.title,
                        images: item.image ? [item.image] : [],
                        metadata: {
                            productId: item.id
                        }
                    },
                    unit_amount: Math.round(unitPrice * 100), // Stripe expects pence
                },
                quantity: item.quantity,
            });

            validCartItems.push({
                id: item.id,
                quantity: item.quantity
            });
        }

        // 5. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${DOMAIN}/success.html`,
            cancel_url: `${DOMAIN}/cancel.html`,
            metadata: {
                cart_items: JSON.stringify(validCartItems)
            }
        });

        console.log(`[CHECKOUT] Session created: ${session.id}`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ url: session.url })
        };

    } catch (error) {
        console.error('[CHECKOUT] Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', details: error.message })
        };
    }
};
