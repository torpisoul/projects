// Search for card OGN-259/298 across all bins
const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

let API_KEY;
envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    if (key === 'JSONBIN_API_KEY') API_KEY = value;
});

const bins = {
    calm: '692da2d1d0ea881f400b9ff3',
    fury: '692da2d2d0ea881f400b9ff6',
    order: '692da2d3d0ea881f400b9ffc',
    chaos: '692da2d443b1c97be9d09818',
    mind: '692da2d543b1c97be9d0981c',
    body: '692da2d6d0ea881f400ba004',
    dual: '692da2d7d0ea881f400ba009'
};

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

async function searchAllBins() {
    console.log('\n=== Searching for card OGN-259/298 in all bins ===\n');

    for (const [domain, binId] of Object.entries(bins)) {
        try {
            const binData = await fetchBin(binId);
            const cards = binData.record.page?.cards?.items || [];

            const found = cards.find(c =>
                (c.publicCode && c.publicCode.toLowerCase().includes('259')) ||
                (c.id && c.id.toLowerCase().includes('259'))
            );

            if (found) {
                console.log(`✅ FOUND in ${domain.toUpperCase()} bin (${binId})`);
                console.log('Card details:');
                console.log('  - ID:', found.id || found.publicCode);
                console.log('  - Name:', found.name);
                console.log('  - Domains:', found.domain?.values?.map(d => d.id).join(', ') || 'none');
                console.log('  - Public Code:', found.publicCode);
                return { domain, binId, card: found };
            } else {
                console.log(`❌ Not in ${domain} bin`);
            }
        } catch (error) {
            console.log(`⚠️  Error checking ${domain} bin:`, error.message);
        }
    }

    console.log('\n❌ Card not found in any bin!');
    return null;
}

searchAllBins();
