// Script to upload complete card-gallery.json to JSONBin (Pro Plan)
// Run with: node upload-cards-single-bin.js

const https = require('https');
const fs = require('fs');
const path = require('path');

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

    const fileSizeKB = (Buffer.byteLength(fileContent, 'utf8') / 1024).toFixed(2);
    const fileSizeMB = (fileSizeKB / 1024).toFixed(2);
    console.log(`  File size: ${fileSizeKB} KB (${fileSizeMB} MB)`);
} catch (error) {
    console.error('✗ Error reading card-gallery.json:', error.message);
    process.exit(1);
}

// Upload to JSONBin
console.log('\nUploading to JSONBin (Pro Plan - 10MB limit)...');

const data = JSON.stringify(cardData);
const options = {
    hostname: 'api.jsonbin.io',
    port: 443,
    path: '/v3/b',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': JSONBIN_API_KEY,
        'X-Bin-Name': 'riftbound-card-gallery',
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
            console.log('✓ Successfully uploaded to JSONBin!');
            console.log(`  Status: ${res.statusCode}`);

            try {
                const response = JSON.parse(responseData);
                const binId = response.metadata.id;
                const binUrl = `https://api.jsonbin.io/v3/b/${binId}`;

                console.log(`\n✓ Card gallery uploaded successfully!`);
                console.log(`  Bin ID: ${binId}`);
                console.log(`  Bin URL: ${binUrl}`);

                if (response.metadata.createdAt) {
                    console.log(`  Created: ${new Date(response.metadata.createdAt).toLocaleString()}`);
                }

                // Save configuration
                const config = {
                    binId: binId,
                    binUrl: binUrl,
                    uploadedAt: new Date().toISOString()
                };

                fs.writeFileSync('card-bin-config.json', JSON.stringify(config, null, 2));
                console.log(`\n✓ Configuration saved to card-bin-config.json`);

                // Print config code
                console.log('\n=== Configuration for config.js ===');
                console.log('Add this to netlify/functions/config.js:\n');
                console.log('module.exports = {');
                console.log('    EXTERNAL_JSON_URL: "https://api.jsonbin.io/v3/b/6927370eae596e708f7294be",');
                console.log('    JSONBIN_API_KEY: "$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a",');
                console.log(`    CARD_GALLERY_BIN: "${binUrl}"`);
                console.log('};\n');

            } catch (e) {
                console.log('Response:', responseData);
            }
        } else {
            console.error('✗ Failed to upload to JSONBin');
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

console.log('Uploading... (this may take a moment for large files)');
req.write(data);
req.end();
