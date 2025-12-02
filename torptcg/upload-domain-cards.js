// Script to upload domain-split cards to JSONBin
// Run with: node upload-domain-cards.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const JSONBIN_API_KEY = '$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a';

// Domain files to upload
const domains = ['calm', 'fury', 'order', 'chaos', 'mind', 'body', 'dual'];
const cardsDir = path.join(__dirname, 'cards-by-domain');

// Store bin IDs
const binIds = {};

// Upload a single file to JSONBin
function uploadToJsonBin(domain, data) {
    return new Promise((resolve, reject) => {
        const jsonData = JSON.stringify(data);

        const options = {
            hostname: 'api.jsonbin.io',
            port: 443,
            path: '/v3/b',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Key': JSONBIN_API_KEY,
                'X-Bin-Name': `riftbound-${domain}-cards`,
                'Content-Length': Buffer.byteLength(jsonData)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const response = JSON.parse(responseData);
                        resolve(response.metadata.id);
                    } catch (e) {
                        reject(new Error('Failed to parse response'));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(jsonData);
        req.end();
    });
}

// Main upload process
async function uploadAll() {
    console.log('Uploading domain card files to JSONBin...\n');

    for (const domain of domains) {
        const filename = path.join(cardsDir, `${domain}-cards.json`);

        if (!fs.existsSync(filename)) {
            console.log(`  ⊘ ${domain}: File not found, skipping`);
            continue;
        }

        try {
            const fileContent = fs.readFileSync(filename, 'utf8');
            const data = JSON.parse(fileContent);

            console.log(`  ↑ Uploading ${domain} (${data.count} cards)...`);
            const binId = await uploadToJsonBin(domain, data);
            binIds[domain] = binId;
            console.log(`  ✓ ${domain}: ${binId}`);

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`  ✗ ${domain}: ${error.message}`);
        }
    }

    // Print config code
    console.log('\n=== JSONBin Configuration ===');
    console.log('Add this to your config.js:\n');
    console.log('const CARD_BINS = {');
    Object.keys(binIds).forEach(domain => {
        console.log(`    ${domain}: "https://api.jsonbin.io/v3/b/${binIds[domain]}",`);
    });
    console.log('};\n');
    console.log('module.exports = {');
    console.log('    EXTERNAL_JSON_URL: "https://api.jsonbin.io/v3/b/6927370eae596e708f7294be",');
    console.log('    JSONBIN_API_KEY: "$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a",');
    console.log('    CARD_BINS');
    console.log('};\n');

    // Save to file
    const configPath = path.join(__dirname, 'card-bins-config.json');
    fs.writeFileSync(configPath, JSON.stringify(binIds, null, 2));
    console.log(`✓ Bin IDs saved to ${configPath}`);
}

uploadAll().catch(console.error);
