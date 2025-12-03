// Rebuild all card bins from card-gallery.json
// This will:
// 1. Read all cards from card-gallery.json
// 2. Categorize them by domain (single vs dual)
// 3. Format legend cards as "Tag: Name"
// 4. Upload to correct JSONBin bins
// 5. Clear and rebuild all bins

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

function formatCardName(card) {
    // Format legend cards as "Tag: Name"
    // Check if card has legend type in cardType.type array
    const isLegend = card.cardType?.type?.some(t => t.id === 'legend');

    if (isLegend) {
        // Get the tag from tags.tags array (first element)
        const tag = card.tags?.tags?.[0] || '';
        const name = card.name || '';

        if (tag && name) {
            return `${tag}: ${name}`;
        }
    }

    return card.name || '';
}

function categorizeCard(card) {
    const domains = card.domain?.values || [];
    const validDomains = ['calm', 'fury', 'mind', 'body', 'chaos', 'order'];

    if (domains.length === 0) {
        console.warn(`⚠️  Card ${card.publicCode} has no domains`);
        return null;
    }

    if (domains.length === 1) {
        const domainId = domains[0].id;
        // Validate it's a known domain
        if (!validDomains.includes(domainId)) {
            console.warn(`⚠️  Card ${card.publicCode} has unknown domain: ${domainId}`);
            return null;
        }
        return domainId;
    }

    if (domains.length >= 2) {
        return 'dual';
    }

    return null;
}

async function rebuildBins() {
    try {
        console.log('\n=== STEP 1: Reading card-gallery.json ===\n');

        const cardGalleryPath = path.join(__dirname, 'card-gallery.json');
        const cardGalleryData = JSON.parse(fs.readFileSync(cardGalleryPath, 'utf8'));
        const allCards = cardGalleryData.page?.cards?.items || [];

        console.log(`✅ Loaded ${allCards.length} cards from card-gallery.json`);

        console.log('\n=== STEP 2: Categorizing cards by domain ===\n');

        const categorized = {
            calm: [],
            fury: [],
            mind: [],
            body: [],
            chaos: [],
            order: [],
            dual: []
        };

        let legendCount = 0;
        let dualCount = 0;

        allCards.forEach(card => {
            const category = categorizeCard(card);

            if (!category) {
                console.warn(`⚠️  Skipping card ${card.publicCode} - no valid category`);
                return;
            }

            // Format card name for legends
            const formattedCard = {
                ...card,
                name: formatCardName(card)
            };

            categorized[category].push(formattedCard);

            if (category === 'dual') dualCount++;
            if (card.cardType?.type?.some(t => t.id === 'legend')) legendCount++;
        });

        console.log('Categorization complete:');
        Object.entries(categorized).forEach(([domain, cards]) => {
            console.log(`  - ${domain}: ${cards.length} cards`);
        });
        console.log(`\n  - Dual-type cards: ${dualCount}`);
        console.log(`  - Legend cards formatted: ${legendCount}`);

        console.log('\n=== STEP 3: Uploading to JSONBin ===\n');

        for (const [domain, cards] of Object.entries(categorized)) {
            const binId = bins[domain];

            if (!binId) {
                console.warn(`⚠️  No bin ID for domain: ${domain}`);
                continue;
            }

            console.log(`Uploading ${cards.length} cards to ${domain} bin...`);

            const binData = {
                page: {
                    cards: {
                        items: cards
                    }
                }
            };

            try {
                await updateBin(binId, binData);
                console.log(`✅ ${domain} bin updated (${cards.length} cards)`);
            } catch (error) {
                console.error(`❌ Failed to update ${domain} bin:`, error.message);
            }

            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n=== ✅ REBUILD COMPLETE ===\n');
        console.log('All card bins have been rebuilt from card-gallery.json');
        console.log('Legend cards are now formatted as "Tag: Name"');
        console.log('Dual-type cards are in the dual bin');
        console.log('\nNext steps:');
        console.log('1. Verify the bins on JSONBin.io');
        console.log('2. Refresh your product page');
        console.log('3. Check that dual-type cards show correct gradients');
        console.log('4. Verify legend cards show as "Tag: Name"');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    }
}

rebuildBins();
