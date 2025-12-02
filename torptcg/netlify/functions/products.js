// Netlify Function: products
// This function proxies an external JSON store (e.g., jsonbin.io) and returns the product list.
// Replace EXTERNAL_JSON_URL with the public URL of your JSON store.

let config = {};
try {
    config = require('./config.js');
} catch (e) {
    // config.js not found, rely on process.env
}

const EXTERNAL_JSON_URL = process.env.EXTERNAL_JSON_URL || config.EXTERNAL_JSON_URL;

exports.handler = async function (event, context) {
    try {
        const response = await fetch(EXTERNAL_JSON_URL);
        if (!response.ok) {
            return {
                statusCode: 502,
                body: JSON.stringify({ error: "Failed to fetch product data" })
            };
        }
        const data = await response.json();
        // Some JSON stores wrap the payload; adjust if needed.
        const products = data?.record ?? data;
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache"
            },
            body: JSON.stringify(products)
        };
    } catch (err) {
        console.error("Error in products function:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" })
        };
    }
};
