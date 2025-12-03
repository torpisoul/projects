// Fix card OGN-259/298 bin assignment
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

console.log('Master Bin ID:', MASTER_BIN_ID);
console.log('API Key loaded:', API_KEY ? 'Yes' : 'No');

const DUAL_BIN_ID = '692da2d7d0ea881f400ba009';
const CALM_BIN_ID = '692da2d1d0ea881f400b9ff3';

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

async function fixCard() {
    try {
        console.log('\n=== STEP 1: Checking Master Inventory ===\n');

        const masterData = await fetchBin(MASTER_BIN_ID);
        const inventory = masterData.record.inventory || [];

        const cardEntry = inventory.find(i => i.productId && i.productId.includes('259'));

        if (!cardEntry) {
            console.log('❌ Card OGN-259/298 NOT found in master inventory');
            return;
        }

        console.log('Found card:', JSON.stringify(cardEntry, null, 2));
        console.log('\nCurrent bin:', cardEntry.binId);
        console.log('Expected bin (dual):', DUAL_BIN_ID);

        if (cardEntry.binId === DUAL_BIN_ID) {
            console.log('✅ Card is already in the correct bin!');
            return;
        }

        console.log('\n=== STEP 2: Fetching Card Data from Wrong Bin ===\n');

        const wrongBinData = await fetchBin(cardEntry.binId);
        let cardsInWrongBin = wrongBinData.record.page?.cards?.items || [];

        const cardData = cardsInWrongBin.find(c =>
            c.publicCode === cardEntry.productId ||
            c.id === cardEntry.productId
        );

        if (!cardData) {
            console.log('❌ Card data not found in bin', cardEntry.binId);
            return;
        }

        console.log('Found card data:', cardData.name);
        console.log('Domains:', cardData.domain?.values?.map(d => d.id).join(', '));

        console.log('\n=== STEP 3: Moving Card to Dual Bin ===\n');

        // Remove from wrong bin
        cardsInWrongBin = cardsInWrongBin.filter(c =>
            c.publicCode !== cardEntry.productId && c.id !== cardEntry.productId
        );

        await updateBin(cardEntry.binId, {
            page: { cards: { items: cardsInWrongBin } }
        });
        console.log('✅ Removed from wrong bin');

        // Add to dual bin
        const dualBinData = await fetchBin(DUAL_BIN_ID);
        let cardsInDualBin = dualBinData.record.page?.cards?.items || [];
        cardsInDualBin.push(cardData);

        await updateBin(DUAL_BIN_ID, {
            page: { cards: { items: cardsInDualBin } }
        });
        console.log('✅ Added to dual bin');

        console.log('\n=== STEP 4: Updating Master Inventory ===\n');

        const cardIndex = inventory.findIndex(i => i.productId === cardEntry.productId);
        inventory[cardIndex].binId = DUAL_BIN_ID;

        await updateBin(MASTER_BIN_ID, { inventory });
        console.log('✅ Updated master inventory');

        console.log('\n=== ✅ FIX COMPLETE ===\n');
        console.log('Card OGN-259/298 has been moved to the dual bin');
        console.log('Refresh your product page to see the changes');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    }
}

fixCard();
