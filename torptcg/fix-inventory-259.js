// Update master inventory to point OGN-259/298 to dual bin
const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

let MASTER_BIN_ID, API_KEY;
envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    if (key === 'MASTER_INVENTORY_BIN_ID') MASTER_BIN_ID = value;
    if (key === 'JSONBIN_API_KEY') API_KEY = value;
});

const DUAL_BIN_ID = '692da2d7d0ea881f400ba009';

function fetchBin(binId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.jsonbin.io',
            path: `/v3/b/${binId}/latest`,
            headers: { 'X-Access-Key': API_KEY }
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function updateBin(binId, data) {
    return new Promise((resolve, reject) => {
        const jsonData = JSON.stringify(data);

        const options = {
            hostname: 'api.jsonbin.io',
            path: `/v3/b/${binId}`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Key': API_KEY,
                'Content-Length': Buffer.byteLength(jsonData)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(responseData));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                }
            });
        });

        req.on('error', reject);
        req.write(jsonData);
        req.end();
    });
}

async function fixInventory() {
    try {
        console.log('\n=== Updating Master Inventory ===\n');

        const masterData = await fetchBin(MASTER_BIN_ID);
        const inventory = masterData.record.inventory || [];

        const cardIndex = inventory.findIndex(i => i.productId === 'ogn-259-298');

        if (cardIndex >= 0) {
            console.log('Found card in inventory:');
            console.log('  Current binId:', inventory[cardIndex].binId);
            console.log('  Stock:', inventory[cardIndex].stock);

            inventory[cardIndex].binId = DUAL_BIN_ID;

            await updateBin(MASTER_BIN_ID, { inventory });

            console.log('\n✅ Updated master inventory');
            console.log('  New binId:', DUAL_BIN_ID);
            console.log('\nCard OGN-259/298 should now appear on your product page!');
            console.log('Refresh your browser to see it.');
        } else {
            console.log('❌ Card not found in master inventory');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

fixInventory();
