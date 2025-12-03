// Add card OGN-259/298 to the dual bin
// This script will:
// 1. Fetch the card data from Riftbound API
// 2. Add it to the dual bin
// 3. Update the master inventory to point to the dual bin

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
const CARD_ID = 'ogn-259-298';

function fetchRiftboundCard(publicCode) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.riftbound.com',
            path: `/api/cards/${publicCode}`,
            headers: { 'Accept': 'application/json' }
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.card || json);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

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

async function addCard() {
    try {
        console.log('\n=== STEP 1: Fetching card data from Riftbound API ===\n');

        const cardData = await fetchRiftboundCard(CARD_ID);
        console.log('✅ Found card:', cardData.name);
        console.log('Domains:', cardData.domain?.values?.map(d => d.id).join(', '));

        console.log('\n=== STEP 2: Adding card to dual bin ===\n');

        const dualBinData = await fetchBin(DUAL_BIN_ID);
        let cards = dualBinData.record.page?.cards?.items || [];

        // Check if card already exists
        const exists = cards.find(c => c.publicCode === CARD_ID || c.id === CARD_ID);
        if (exists) {
            console.log('⚠️  Card already exists in dual bin');
        } else {
            cards.push(cardData);
            await updateBin(DUAL_BIN_ID, {
                page: { cards: { items: cards } }
            });
            console.log('✅ Added card to dual bin');
        }

        console.log('\n=== STEP 3: Updating master inventory ===\n');

        const masterData = await fetchBin(MASTER_BIN_ID);
        const inventory = masterData.record.inventory || [];

        const cardIndex = inventory.findIndex(i => i.productId === CARD_ID);
        if (cardIndex >= 0) {
            inventory[cardIndex].binId = DUAL_BIN_ID;
            await updateBin(MASTER_BIN_ID, { inventory });
            console.log('✅ Updated master inventory to point to dual bin');
        } else {
            console.log('⚠️  Card not found in master inventory');
        }

        console.log('\n=== ✅ COMPLETE ===\n');
        console.log('Card OGN-259/298 is now properly set up');
        console.log('Refresh your product page to see it');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.message.includes('404')) {
            console.log('\n⚠️  Card not found in Riftbound API');
            console.log('You may need to add the card data manually');
        }
    }
}

addCard();
