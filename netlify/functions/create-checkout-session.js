// netlify/functions/create-checkout-session.js
const inventoryFunction = require('./inventory');

// Initialize Stripe conditionally
let stripe;
try {
    if (process.env.STRIPE_SECRET_KEY) {
        stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    } else {
        console.warn('⚠️ STRIPE_SECRET_KEY is missing. Checkout will fail.');
    }
} catch (err) {
    console.error('Failed to initialize Stripe:', err);
}

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (!stripe) {
        console.error('Stripe is not initialized. Check STRIPE_SECRET_KEY.');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Payment system not configured (Missing Stripe Key)' })
        };
    }

    try {
        const { cart } = JSON.parse(event.body);

        if (!cart || cart.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Cart is empty' }) };
        }

        // 1. Validate Stock and Price
        const mockEvent = { httpMethod: 'GET', queryStringParameters: {} };
        // We need to pass the context, but also ensure environment variables are available if inventory relies on them
        const inventoryResponse = await inventoryFunction.handler(mockEvent, context);

        if (inventoryResponse.statusCode !== 200) {
            console.error('Inventory fetch failed:', inventoryResponse.body);
            throw new Error(`Could not fetch inventory for validation: ${inventoryResponse.statusCode}`);
        }

        const inventoryData = JSON.parse(inventoryResponse.body);
        const products = Array.isArray(inventoryData) ? inventoryData : (inventoryData.products || []);

        const lineItems = [];
        const metadataItems = [];

        for (const cartItem of cart) {
            const product = products.find(p => p.id === cartItem.id);

            if (!product) {
                return { statusCode: 400, body: JSON.stringify({ error: `Product ${cartItem.title} not found` }) };
            }

            if (product.stock < cartItem.quantity) {
                return { statusCode: 400, body: JSON.stringify({ error: `Insufficient stock for ${product.title}` }) };
            }

            // Verify price (security: always use server-side price)
            lineItems.push({
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: product.title,
                        images: product.image ? [product.image] : [],
                        metadata: {
                            id: product.id
                        }
                    },
                    unit_amount: Math.round(product.price * 100), // Stripe expects pence
                },
                quantity: cartItem.quantity,
            });

            metadataItems.push({ id: product.id, q: cartItem.quantity });
        }

        // 2. Create Stripe Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.URL || 'http://localhost:8080'}/success.html`,
            cancel_url: `${process.env.URL || 'http://localhost:8080'}/cancel.html`,
            metadata: {
                // Store simplified cart in metadata for webhook
                // Warning: Metadata has 500 char limit.
                cart_items: JSON.stringify(metadataItems).substring(0, 500)
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ url: session.url })
        };

    } catch (error) {
        console.error('Error creating checkout session:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
