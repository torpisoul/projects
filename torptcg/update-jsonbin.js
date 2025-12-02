// Script to update JSONBin with card-gallery.json data
// Run with: node update-jsonbin.js

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const JSONBIN_BIN_ID = '6927370eae596e708f7294be';
const JSONBIN_API_KEY = '$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a';

// Read the card-gallery.json file
const cardGalleryPath = path.join(__dirname, 'card-gallery.json');
console.log('Reading card-gallery.json...');

let cardData;
try {
    const fileContent = fs.readFileSync(cardGalleryPath, 'utf8');
    cardData = JSON.parse(fileContent);
    console.log('✓ Successfully parsed card-gallery.json');

    // Show stats
    if (cardData.page && cardData.page.cards && cardData.page.cards.items) {
        console.log(`  Total cards: ${cardData.page.cards.items.length}`);
    }
} catch (error) {
    console.error('✗ Error reading card-gallery.json:', error.message);
    process.exit(1);
}

// Update JSONBin
console.log('\nUpdating JSONBin...');

const data = JSON.stringify(cardData);
const options = {
    hostname: 'api.jsonbin.io',
    port: 443,
    path: `/v3/b/${JSONBIN_BIN_ID}`,
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': JSONBIN_API_KEY,
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = https.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✓ Successfully updated JSONBin!');
            console.log(`  Status: ${res.statusCode}`);

            try {
                const response = JSON.parse(responseData);
                if (response.metadata) {
                    console.log(`  Updated: ${new Date(response.metadata.createdAt).toLocaleString()}`);
                }
            } catch (e) {
                // Ignore parse errors
            }

            console.log('\n✓ Card gallery data is now live!');
            console.log('  You can now access it via /.netlify/functions/inventory');
        } else {
            console.error('✗ Failed to update JSONBin');
            console.error(`  Status: ${res.statusCode}`);
            console.error(`  Response: ${responseData}`);
            process.exit(1);
        }
    });
});

req.on('error', (error) => {
    console.error('✗ Request error:', error.message);
    process.exit(1);
});

req.write(data);
req.end();
