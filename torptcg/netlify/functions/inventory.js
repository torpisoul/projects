// Netlify Function: inventory
// Handles both GET (read inventory) and POST (update stock) operations
// Uses native https module to avoid dependency issues

const https = require('https');
let config = {};
try {
    config = require('./config.js');
} catch (e) {
    // config.js not found, rely on process.env
}

const EXTERNAL_JSON_URL = process.env.EXTERNAL_JSON_URL || config.EXTERNAL_JSON_URL;
const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY || config.JSONBIN_API_KEY;

// Helper function to make HTTP requests
function makeRequest(url, options, bodyData) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    data: data
                });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (bodyData) {
            req.write(bodyData);
        }
        req.end();
    });
}

exports.handler = async function (event, context) {
    console.log("Inventory function invoked (https version)");
    console.log("Method:", event.httpMethod);

    const method = event.httpMethod;
    const headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    if (method === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // ============================================
        // GET: Fetch current inventory
        // ============================================
        if (method === 'GET') {
            const url = new URL(EXTERNAL_JSON_URL);
            const options = {
                method: 'GET',
                headers: {}
            };

            if (JSONBIN_API_KEY) {
                options.headers['X-Access-Key'] = JSONBIN_API_KEY;
            }

            const response = await makeRequest(url, options);

            if (!response.ok) {
                console.error('Failed to fetch from JSONBin:', response.status);
                return {
                    statusCode: 502,
                    headers,
                    body: JSON.stringify({ error: "Failed to fetch inventory data", details: response.data })
                };
            }

            const data = JSON.parse(response.data);
            const inventory = data?.record ?? data;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(inventory)
            };
        }

        // ============================================
        // POST: Update stock
        // ============================================
        // ============================================
        // POST: Update inventory (Stock, Add, Edit, Delete)
        // ============================================
        if (method === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const { action, productId, delta, product: productData } = body;

            // 1. Fetch current inventory
            const url = new URL(EXTERNAL_JSON_URL);
            const getOptions = {
                method: 'GET',
                headers: {}
            };
            if (JSONBIN_API_KEY) {
                getOptions.headers['X-Access-Key'] = JSONBIN_API_KEY;
            }

            const fetchResponse = await makeRequest(url, getOptions);
            if (!fetchResponse.ok) {
                return { statusCode: 502, headers, body: JSON.stringify({ error: "Failed to fetch current inventory" }) };
            }

            const currentData = JSON.parse(fetchResponse.data);
            const inventory = currentData?.record ?? currentData;

            // Ensure products array exists
            if (!inventory.products) {
                inventory.products = [];
            }

            let responseBody = {};

            // 2. Handle Actions
            if (action === 'create') {
                // Generate ID if not provided
                const newId = productData.id || 'p' + Date.now();
                const newProduct = {
                    ...productData,
                    id: newId,
                    stock: parseInt(productData.stock || 0),
                    price: parseFloat(productData.price || 0),
                    available: (productData.stock > 0 || productData.preOrder === true)
                };

                inventory.products.push(newProduct);
                responseBody = { success: true, message: "Product created", product: newProduct };

            } else if (action === 'update') {
                const index = inventory.products.findIndex(p => p.id === productData.id);
                if (index === -1) {
                    return { statusCode: 404, headers, body: JSON.stringify({ error: `Product ${productData.id} not found` }) };
                }

                // Merge updates
                inventory.products[index] = {
                    ...inventory.products[index],
                    ...productData,
                    stock: parseInt(productData.stock),
                    price: parseFloat(productData.price),
                    available: (parseInt(productData.stock) > 0 || productData.preOrder === true)
                };

                responseBody = { success: true, message: "Product updated", product: inventory.products[index] };

            } else if (action === 'delete') {
                const idToDelete = productId || productData?.id;
                const initialLength = inventory.products.length;
                inventory.products = inventory.products.filter(p => p.id !== idToDelete);

                if (inventory.products.length === initialLength) {
                    return { statusCode: 404, headers, body: JSON.stringify({ error: `Product ${idToDelete} not found` }) };
                }

                responseBody = { success: true, message: "Product deleted" };

            } else {
                // Default: Stock Update (Existing Logic)
                if (!productId) {
                    return { statusCode: 400, headers, body: JSON.stringify({ error: "productId is required" }) };
                }

                const product = inventory.products.find(p => p.id === productId);
                if (!product) {
                    return { statusCode: 404, headers, body: JSON.stringify({ error: `Product ${productId} not found` }) };
                }

                let newStock;
                if (action === 'set') {
                    newStock = body.stock;
                } else {
                    newStock = (product.stock || 0) + delta;
                }

                if (newStock < 0) {
                    return {
                        statusCode: 409,
                        headers,
                        body: JSON.stringify({ error: "Insufficient stock", currentStock: product.stock })
                    };
                }

                const oldStock = product.stock;
                product.stock = newStock;
                product.available = newStock > 0 || product.preOrder === true;

                console.log(`[INVENTORY] Product ${productId}: ${oldStock} → ${newStock}`);

                responseBody = {
                    success: true,
                    product: {
                        id: product.id,
                        title: product.title,
                        oldStock,
                        newStock,
                        available: product.available
                    }
                };
            }

            // 3. Save to JSONBin
            const binId = EXTERNAL_JSON_URL.split('/').pop();
            const updateUrl = new URL(`https://api.jsonbin.io/v3/b/${binId}`);
            const updateOptions = {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            if (JSONBIN_API_KEY) {
                updateOptions.headers['X-Access-Key'] = JSONBIN_API_KEY;
            }

            const updateResponse = await makeRequest(updateUrl, updateOptions, JSON.stringify(inventory));

            if (!updateResponse.ok) {
                console.error('Failed to update JSONBin:', updateResponse.status);
                return { statusCode: 502, headers, body: JSON.stringify({ error: "Failed to update inventory" }) };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(responseBody)
            };
        }

        return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

    } catch (err) {
        console.error("Error:", err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Internal server error", message: err.message })
        };
    }
};
