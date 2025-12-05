exports.handler = async (event, context) => {
    // Log for debugging
    console.log('[CREATE-CHECKOUT] Function called');
    console.log('[CREATE-CHECKOUT] Stripe key exists:', !!process.env.STRIPE_SECRET_KEY);

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Check if Stripe key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('[CREATE-CHECKOUT] STRIPE_SECRET_KEY not configured');
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Stripe not configured',
                message: 'STRIPE_SECRET_KEY environment variable is not set.'
            })
        };
    }

    try {
        const { items } = JSON.parse(event.body);
        console.log('[CREATE-CHECKOUT] Items received:', items?.length);

        if (!items || items.length === 0) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'No items in cart' })
            };
        }

        // Initialize Stripe
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        console.log('[CREATE-CHECKOUT] Stripe initialized');

        // Create line items for Stripe
        const line_items = items.map(item => ({
            price_data: {
                currency: 'gbp',
                product_data: {
                    name: item.title,
                    images: item.image ? [item.image] : [],
                    metadata: {
                        product_id: item.id,
                        category: item.category || ''
                    }
                },
                unit_amount: Math.round(item.price * 100), // Convert to pence
            },
            quantity: item.quantity,
        }));

        console.log('[CREATE-CHECKOUT] Line items created:', line_items.length);

        // Get the site URL from environment or construct it
        const siteUrl = process.env.URL || 'http://localhost:8888';
        console.log('[CREATE-CHECKOUT] Site URL:', siteUrl);

        // Create Stripe Checkout Session - UK mainland only
        console.log('[CREATE-CHECKOUT] Creating Stripe session...');
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',

            // Collect shipping address - UK only
            shipping_address_collection: {
                allowed_countries: ['GB'],
            },

            // Collect billing address
            billing_address_collection: 'required',

            // Single UK shipping option
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {
                            amount: 350, // £3.50 in pence
                            currency: 'gbp',
                        },
                        display_name: 'UK Mainland Shipping',
                        delivery_estimate: {
                            minimum: {
                                unit: 'business_day',
                                value: 3,
                            },
                            maximum: {
                                unit: 'business_day',
                                value: 5,
                            },
                        },
                    },
                },
            ],

            // Phone number collection
            phone_number_collection: {
                enabled: true,
            },

            success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${siteUrl}/?cancelled=true`,

            metadata: {
                // Store cart items for webhook processing
                cart_items: JSON.stringify(items.map(i => ({
                    id: i.id,
                    quantity: i.quantity
                }))),
            },

            // Add custom text for shipping note
            custom_text: {
                shipping_address: {
                    message: 'We currently ship to UK mainland addresses only. Shipping cost is £3.50.',
                },
            },
        });

        console.log('[CREATE-CHECKOUT] Session created:', session.id);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId: session.id,
                url: session.url
            })
        };

    } catch (error) {
        console.error('[CREATE-CHECKOUT] Error:', error.message);
        console.error('[CREATE-CHECKOUT] Error type:', error.type);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Failed to create checkout session',
                message: error.message,
                type: error.type || 'Unknown error type'
            })
        };
    }
};
