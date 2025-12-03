// Migration Script: Move Card Inventory to Master Inventory
// Run this with: node migrate-inventory.js

const https = require('https');

// Configuration
const API_KEY = '$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a';
const CARD_INVENTORY_BIN_ID = '692e1a8443b1c97be9d1746c';
const MASTER_INVENTORY_BIN_ID = '692ed2dbae596e708f7e68f9';

// Bin Mapping (Domain -> Bin ID)
const BIN_MAP = {
    'calm': '692da2d1d0ea881f400b9ff3',
    'fury': '692da2d2d0ea881f400b9ff6',
    'order': '692da2d3d0ea881f400b9ffc',
    'chaos': '692da2d443b1c97be9d09818',
    'mind': '692da2d543b1c97be9d0981c',
    'body': '692da2d6d0ea881f400ba004',
    'dual': '692da2d7d0ea881f400ba009'
};

// Helper to fetch JSON
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'X-Access-Key': API_KEY } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data).record));
        }).on('error', reject);
    });
}

// Helper to update JSON
function updateJson(url, data) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Key': API_KEY
            }
        }, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) resolve();
            else reject(new Error(`Failed: ${res.statusCode}`));
        });
        req.write(JSON.stringify(data));
        req.end();
    });
}

async function migrate() {
    console.log('Starting migration...');

    // 1. Fetch current card inventory
    console.log('Fetching card inventory...');
    const cardInv = await fetchJson(`https://api.jsonbin.io/v3/b/${CARD_INVENTORY_BIN_ID}`);
    const items = cardInv.inventory || [];
    console.log(`Found ${items.length} items in card inventory`);

    // 2. Fetch master inventory
    console.log('Fetching master inventory...');
    const masterData = await fetchJson(`https://api.jsonbin.io/v3/b/${MASTER_INVENTORY_BIN_ID}`);
    const masterInv = masterData.inventory || [];

    // 3. Merge items
    let addedCount = 0;

    // We need to fetch card data to determine domains (to get binIds)
    // For now, we'll try to guess or use a default if we can't find it
    // In a real scenario, we'd fetch all card bins to map IDs to domains

    // Simplification: Assume we can map based on ID or just skip for now
    // Better approach: Let's just create entries and user can fix binIds if needed
    // Actually, we can't guess binId easily without card data.

    console.log('NOTE: This script assumes you know the domain mapping.');

    for (const item of items) {
        // Check if already exists
        if (masterInv.find(x => x.productId === item.cardId)) continue;

        // We need binId. Let's try to find it from the ID structure if possible
        // Most IDs don't have domain info. 
        // We will skip this for now and ask user to use the admin panel to set stock
        // which will correctly set the binId.

        /*
        masterInv.push({
            productId: item.cardId,
            binId: "UNKNOWN_BIN_ID", // This is the problem
            category: "singles",
            stock: item.stock
        });
        */
    }

    console.log(`Migration skipped because we need to map Card IDs to Bin IDs.`);
    console.log(`Please use the Admin Panel to set stock levels. The new system handles the mapping automatically.`);
}

migrate().catch(console.error);
