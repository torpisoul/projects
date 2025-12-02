// Script to upload card-gallery.json using JSONBin XL Bins API
// XL Bins support files up to 10MB (experimental feature)
// Run with: node upload-xl-bin.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const JSONBIN_API_KEY = '$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a';
const BIN_NAME = 'riftbound-card-gallery';

// Read the card-gallery.json file
const cardGalleryPath = path.join(__dirname, 'card-gallery.json');
console.log('Reading card-gallery.json...');

let fileContent;
try {
    fileContent = fs.readFileSync(cardGalleryPath, 'utf8');
    const cardData = JSON.parse(fileContent);
    console.log('✓ Successfully parsed card-gallery.json');

    // Show stats
    if (cardData.page && cardData.page.cards && cardData.page.cards.items) {
        console.log(`  Total cards: ${cardData.page.cards.items.length}`);
    }

    const fileSizeKB = (Buffer.byteLength(fileContent, 'utf8') / 1024).toFixed(2);
    const fileSizeMB = (fileSizeKB / 1024).toFixed(2);
    console.log(`  File size: ${fileSizeKB} KB (${fileSizeMB} MB)`);

    if (fileSizeMB > 10) {
        console.error('✗ File is too large for XL Bins (max 10MB)');
        process.exit(1);
    }
} catch (error) {
    console.error('✗ Error reading card-gallery.json:', error.message);
    process.exit(1);
}

// Create multipart/form-data payload
const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
const delimiter = `\r\n--${boundary}\r\n`;
const closeDelimiter = `\r\n--${boundary}--`;

// Build the multipart body
const multipartBody = Buffer.concat([
    Buffer.from(delimiter),
    Buffer.from('Content-Disposition: form-data; name="xlbin"; filename="card-gallery.json"\r\n'),
    Buffer.from('Content-Type: application/json\r\n\r\n'),
    Buffer.from(fileContent),
    Buffer.from(closeDelimiter)
]);

console.log('\nUploading to JSONBin XL Bins API...');
console.log('This may take a moment for large files...\n');

const options = {
    hostname: 'api.jsonbin.io',
    port: 443,
    path: '/v3/xl/b',
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'X-Master-Key': JSONBIN_API_KEY,
        'X-Bin-Name': BIN_NAME,
        'X-Bin-Private': 'false', // Make it public so it can be read without auth
        'Content-Length': multipartBody.length
    }
};

const req = https.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✓ Successfully uploaded to JSONBin XL Bins!');
            console.log(`  Status: ${res.statusCode}`);

            try {
                const response = JSON.parse(responseData);
                const binId = response.metadata.id;
                const binUrl = `https://api.jsonbin.io/v3/xl/b/${binId}`;

                console.log(`\n✓ Card gallery uploaded successfully!`);
                console.log(`  Bin ID: ${binId}`);
                console.log(`  Bin URL: ${binUrl}`);
                console.log(`  Bin Name: ${response.metadata.name}`);
                console.log(`  Private: ${response.metadata.private}`);

                if (response.metadata.createdAt) {
                    console.log(`  Created: ${new Date(response.metadata.createdAt).toLocaleString()}`);
                }

                // Save configuration
                const config = {
                    binId: binId,
                    binUrl: binUrl,
                    binName: response.metadata.name,
                    uploadedAt: new Date().toISOString(),
                    isXLBin: true
                };

                fs.writeFileSync('card-bin-config.json', JSON.stringify(config, null, 2));
                console.log(`\n✓ Configuration saved to card-bin-config.json`);

                // Print config code
                console.log('\n=== Configuration for config.js ===');
                console.log('Update netlify/functions/config.js:\n');
                console.log('module.exports = {');
                console.log('    EXTERNAL_JSON_URL: "https://api.jsonbin.io/v3/b/6927370eae596e708f7294be",');
                console.log('    JSONBIN_API_KEY: "$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a",');
                console.log(`    CARD_GALLERY_BIN: "${binUrl}"`);
                console.log('};\n');

                console.log('✓ Done! Your card gallery is now live on JSONBin.');
                console.log('\nNext steps:');
                console.log('1. Update config.js with the bin URL above');
                console.log('2. Deploy to Netlify');
                console.log('3. Test: https://your-site.netlify.app/.netlify/functions/cards');

            } catch (e) {
                console.log('Response:', responseData);
            }
        } else {
            console.error('✗ Failed to upload to JSONBin');
            console.error(`  Status: ${res.statusCode}`);
            console.error(`  Response: ${responseData}`);

            if (res.statusCode === 401) {
                console.error('\n  → Check that your API key is correct');
            } else if (res.statusCode === 413) {
                console.error('\n  → File is too large (max 10MB for XL Bins)');
            }

            process.exit(1);
        }
    });
});

req.on('error', (error) => {
    console.error('✗ Request error:', error.message);
    process.exit(1);
});

req.write(multipartBody);
req.end();
