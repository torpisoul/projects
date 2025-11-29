// Simple test function to debug JSONBin connection
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
    };

    try {
        const url = "https://api.jsonbin.io/v3/b/6927370eae596e708f7294be";
        const apiKey = process.env.JSONBIN_API_KEY;

        console.log('[TEST] Fetching from:', url);
        console.log('[TEST] API Key exists:', !!apiKey);
        console.log('[TEST] API Key length:', apiKey ? apiKey.length : 0);

        // Try without API key first
        console.log('[TEST] Attempting fetch WITHOUT API key...');
        const response1 = await fetch(url);
        console.log('[TEST] Response status (no key):', response1.status);

        if (response1.ok) {
            const data1 = await response1.json();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    method: 'no_api_key',
                    status: response1.status,
                    hasRecord: !!data1.record,
                    productCount: data1.record?.products?.length || data1.products?.length || 0
                })
            };
        }

        // Try with API key
        if (apiKey) {
            console.log('[TEST] Attempting fetch WITH API key...');
            const response2 = await fetch(url, {
                headers: {
                    'X-Access-Key': apiKey
                }
            });
            console.log('[TEST] Response status (with key):', response2.status);

            if (response2.ok) {
                const data2 = await response2.json();
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        method: 'with_api_key',
                        status: response2.status,
                        hasRecord: !!data2.record,
                        productCount: data2.record?.products?.length || data2.products?.length || 0
                    })
                };
            }

            const errorText = await response2.text();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: false,
                    method: 'with_api_key',
                    status: response2.status,
                    error: errorText
                })
            };
        }

        const errorText = await response1.text();
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: false,
                method: 'no_api_key',
                status: response1.status,
                error: errorText,
                note: 'No API key configured'
            })
        };

    } catch (err) {
        console.error('[TEST] Error:', err);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: false,
                error: err.message,
                stack: err.stack
            })
        };
    }
};
