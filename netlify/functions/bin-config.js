// Netlify Function: bin-config
// Returns bin IDs from environment variables for client-side use
// This allows admin pages to get bin IDs without hardcoding them

exports.handler = async function (event, context) {
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            calm: process.env.CALM_BIN_ID,
            fury: process.env.FURY_BIN_ID,
            order: process.env.ORDER_BIN_ID,
            chaos: process.env.CHAOS_BIN_ID,
            mind: process.env.MIND_BIN_ID,
            body: process.env.BODY_BIN_ID,
            dual: process.env.DUAL_BIN_ID,
            products: process.env.PRODUCTS_BIN_ID
        })
    };
};
