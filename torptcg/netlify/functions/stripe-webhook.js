const https = require('https');

exports.handler = async function (event, context) {
    console.log('[STRIPE-WEBHOOK] Function invoked');

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const stripeEvent = JSON.parse(event.body);
        console.log('[STRIPE-WEBHOOK] Event type:', stripeEvent.type);

        // Handle different event types
        switch (stripeEvent.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(stripeEvent.data.object);
                break;

            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(stripeEvent.data.object);
                break;

            default:
                console.log('[STRIPE-WEBHOOK] Unhandled event type:', stripeEvent.type);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ received: true })
        };

    } catch (error) {
        console.error('[STRIPE-WEBHOOK] Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Webhook handler failed', details: error.message })
        };
    }
};

async function handleCheckoutCompleted(session) {
    console.log('[STRIPE-WEBHOOK] Checkout completed:', session.id);
    console.log('[STRIPE-WEBHOOK] Session metadata:', session.metadata);

    // Extract cart items from metadata
    let cartItems = [];

    if (session.metadata?.cart_items) {
        try {
            cartItems = JSON.parse(session.metadata.cart_items);
            console.log('[STRIPE-WEBHOOK] Cart items:', cartItems);
        } catch (error) {
            console.error('[STRIPE-WEBHOOK] Failed to parse cart_items:', error);
        }
    }

    // Fallback to old single-product format
    if (cartItems.length === 0 && session.metadata?.productId) {
        cartItems = [{
            id: session.metadata.productId,
            quantity: parseInt(session.metadata.quantity || '1')
        }];
    }

    if (cartItems.length === 0) {
        console.warn('[STRIPE-WEBHOOK] No items found in metadata');
        return;
    }

    console.log(`[STRIPE-WEBHOOK] Processing ${cartItems.length} items`);

    // Update stock for each item
    const results = [];
    for (const item of cartItems) {
        try {
            console.log(`[STRIPE-WEBHOOK] Decreasing stock for ${item.id} by ${item.quantity}`);
            await updateInventoryStock(item.id, -item.quantity);
            results.push({ id: item.id, success: true });
            console.log(`[STRIPE-WEBHOOK] Stock updated for ${item.id}`);
        } catch (error) {
            console.error(`[STRIPE-WEBHOOK] Failed to update stock for ${item.id}:`, error);
            results.push({ id: item.id, success: false, error: error.message });
            // Continue with other items even if one fails
        }
    }

    console.log('[STRIPE-WEBHOOK] Stock update results:', results);

    // Check if any updates failed
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
        console.error('[STRIPE-WEBHOOK] Some stock updates failed:', failures);
        // TODO: Send alert email to admin
    }
}

async function handlePaymentSucceeded(paymentIntent) {
    console.log('[STRIPE-WEBHOOK] Payment succeeded:', paymentIntent.id);
    // Additional handling if needed
}

async function updateInventoryStock(productId, delta) {
    const INVENTORY_URL = process.env.URL || 'http://localhost:8888';
    const url = `${INVENTORY_URL}/.netlify/functions/inventory`;

    const payload = JSON.stringify({
        productId: productId,
        delta: delta,
        action: 'adjust'
    });

    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const protocol = urlObj.protocol === 'https:' ? https : require('http');

        const req = protocol.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}
