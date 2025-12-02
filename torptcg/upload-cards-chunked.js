// Alternative: Create empty bin first, then update with data
// This works around HTTP request size limits
// Run with: node upload-cards-chunked.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const JSONBIN_API_KEY = '$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a';

// Helper function to make HTTP requests
function makeRequest(url, options, bodyData) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    data: data
                });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (bodyData) {
            req.write(bodyData);
        }
        req.end();
    });
}

async function uploadCardGallery() {
    // Read the card-gallery.json file
    const cardGalleryPath = path.join(__dirname, 'card-gallery.json');
    console.log('Reading card-gallery.json...');

    let cardData;
    try {
        const fileContent = fs.readFileSync(cardGalleryPath, 'utf8');
        cardData = JSON.parse(fileContent);
        console.log('✓ Successfully parsed card-gallery.json');

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

    console.log('\n=== MANUAL UPLOAD REQUIRED ===');
    console.log('\nDue to HTTP request size limitations, please upload manually:');
    console.log('\n1. Go to https://jsonbin.io/');
    console.log('2. Click "Create Bin"');
    console.log('3. Name it: "riftbound-card-gallery"');
    console.log('4. Copy the ENTIRE contents of card-gallery.json');
    console.log('5. Paste into the JSONBin editor');
    console.log('6. Click "Create"');
    console.log('7. Copy the Bin ID from the URL');
    console.log('\nOnce you have the Bin ID, update netlify/functions/config.js:');
    console.log('\nmodule.exports = {');
    console.log('    EXTERNAL_JSON_URL: "https://api.jsonbin.io/v3/b/6927370eae596e708f7294be",');
    console.log('    JSONBIN_API_KEY: "$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a",');
    console.log('    CARD_GALLERY_BIN: "https://api.jsonbin.io/v3/b/YOUR_BIN_ID_HERE"');
    console.log('};');
    console.log('\n✓ File is ready for manual upload at: ' + cardGalleryPath);
}

uploadCardGallery();
