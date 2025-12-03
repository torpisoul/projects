// Check master inventory for card OGN-259/298
const https = require('https');

const MASTER_BIN_ID = process.env.MASTER_INVENTORY_BIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;

const options = {
    hostname: 'api.jsonbin.io',
    path: `/v3/b/${MASTER_BIN_ID}/latest`,
    headers: {
        'X-Access-Key': API_KEY
    }
};

https.get(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const json = JSON.parse(data);
        const inventory = json.record.inventory || [];

        console.log('\n=== SEARCHING FOR CARD OGN-259/298 ===\n');

        const card = inventory.find(i => i.productId && i.productId.includes('259'));

        if (card) {
            console.log('Found card in master inventory:');
            console.log(JSON.stringify(card, null, 2));
            console.log('\n--- Bin Information ---');
            console.log('Current binId:', card.binId);
            console.log('Expected binId (dual):', '692da2d7d0ea881f400ba009');
            console.log('Is in correct bin?', card.binId === '692da2d7d0ea881f400ba009' ? 'YES' : 'NO - NEEDS FIX');
        } else {
            console.log('Card NOT found in master inventory');
            console.log('Searching all inventory items for similar IDs...\n');

            const similar = inventory.filter(i => i.productId && (
                i.productId.toLowerCase().includes('ogn') ||
                i.productId.includes('259')
            ));

            console.log(`Found ${similar.length} similar items:`);
            similar.forEach(item => {
                console.log(`  - ${item.productId} (bin: ${item.binId})`);
            });
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
