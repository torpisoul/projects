const fs = require('fs');
const path = require('path');
const https = require('https');
const { EXTERNAL_JSON_URL, JSONBIN_API_KEY } = require('../netlify/functions/config.js');

// Helper to make requests
function makeRequest(url, options, bodyData) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        data: parsedData
                    });
                } catch (e) {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });
        req.on('error', (e) => reject(e));
        if (bodyData) req.write(bodyData);
        req.end();
    });
}

async function parseAndUpload() {
    try {
        console.log('Reading card-gallery.html...');
        const htmlPath = path.join(__dirname, '../card-gallery.html');

        if (!fs.existsSync(htmlPath)) {
            console.error('❌ card-gallery.html not found!');
            return;
        }

        const html = fs.readFileSync(htmlPath, 'utf8');
        const products = [];
        const seenIds = new Set();

        console.log('Searching for card data in HTML...');

        // Find all card objects by looking for: "id":"ogn-XXX-YYY","name":"..."
        const idNamePattern = /"id":\s*"(ogn-[^"]+)",\s*"name":\s*"([^"]+)"/g;
        let match;

        while ((match = idNamePattern.exec(html)) !== null) {
            const internalId = match[1];
            const title = match[2];

            // Find the publicCode and cardImage within the next 10000 characters
            const matchIndex = match.index;
            const context = html.substring(matchIndex, Math.min(html.length, matchIndex + 10000));

            // Find publicCode
            const publicCodeMatch = context.match(/"publicCode":\s*"([^"]+)"/);
            if (!publicCodeMatch) continue;
            const id = publicCodeMatch[1];

            if (seenIds.has(id)) continue;

            // Find cardImage URL
            const imageMatch = context.match(/"cardImage":\s*\{[^}]*?"url":\s*"([^"]+)"/);
            if (!imageMatch) continue;
            const image = imageMatch[1];

            // Extract domain
            const domainMatch = context.match(/"domain":\s*\{[^}]*?"values":\s*\[([^\]]+)\]/);
            let domainLabels = '';
            if (domainMatch) {
                const domainValues = domainMatch[1].matchAll(/"label":\s*"([^"]+)"/g);
                const domains = [];
                for (const dv of domainValues) {
                    domains.push(dv[1]);
                }
                domainLabels = domains.join(', ');
            }

            // Extract rarity
            const rarityMatch = context.match(/"rarity":\s*\{[^}]*?"value":\s*\{[^}]*?"label":\s*"([^"]+)"/);
            const rarity = rarityMatch ? rarityMatch[1] : 'Common';

            // Extract energy
            const energyMatch = context.match(/"energy":\s*\{[^}]*?"value":\s*\{[^}]*?"id":\s*(\d+)/);
            const energy = energyMatch ? parseInt(energyMatch[1]) : 0;

            if (id && image) {
                products.push({
                    id: id,
                    title: title,
                    category: 'singles',
                    domain: domainLabels || 'Unknown',
                    rarity: rarity,
                    energy: energy,
                    price: 0.00,
                    stock: 0,
                    available: false,
                    image: image,
                    preOrder: false
                });
                seenIds.add(id);
            }
        }

        console.log(`Found ${products.length} cards.`);

        if (products.length === 0) {
            console.error("No products found! Check the HTML format.");
            return;
        }

        // Upload to JSONBin
        console.log('Uploading to JSONBin...');
        const binId = EXTERNAL_JSON_URL.split('/').pop();
        const updateUrl = new URL(`https://api.jsonbin.io/v3/b/${binId}`);

        const updateOptions = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Key': JSONBIN_API_KEY
            }
        };

        const payload = JSON.stringify({
            products: products,
            lastUpdated: new Date().toISOString()
        });

        const response = await makeRequest(updateUrl, updateOptions, payload);

        if (response.ok) {
            console.log('✅ Successfully imported cards from gallery!');
            console.log(`📦 Uploaded ${products.length} cards to JSONBin`);
        } else {
            console.error('❌ Failed to upload:', response.status, response.data);
        }

    } catch (err) {
        console.error('❌ Error:', err);
    }
}

parseAndUpload();
