// Script to split card-gallery.json by domain
// Run with: node split-cards-by-domain.js

const fs = require('fs');
const path = require('path');

// Read the card-gallery.json file
const cardGalleryPath = path.join(__dirname, 'card-gallery.json');
console.log('Reading card-gallery.json...');

let cardData;
try {
    const fileContent = fs.readFileSync(cardGalleryPath, 'utf8');
    cardData = JSON.parse(fileContent);
    console.log('✓ Successfully parsed card-gallery.json');
} catch (error) {
    console.error('✗ Error reading card-gallery.json:', error.message);
    process.exit(1);
}

// Extract cards array
const cards = cardData.page?.cards?.items || [];
console.log(`\nTotal cards: ${cards.length}`);

// Domain bins
const domainBins = {
    calm: [],
    fury: [],
    order: [],
    chaos: [],
    mind: [],
    body: [],
    dual: [] // For cards with multiple domains
};

// Split cards by domain
cards.forEach(card => {
    const domains = card.domain?.values || [];

    if (domains.length === 0) {
        console.warn(`Card "${card.name}" has no domain, skipping...`);
        return;
    }

    if (domains.length === 1) {
        // Single domain
        const domainId = domains[0].id;
        if (domainBins[domainId]) {
            domainBins[domainId].push(card);
        } else {
            console.warn(`Unknown domain "${domainId}" for card "${card.name}"`);
        }
    } else {
        // Multiple domains - goes to dual bin
        domainBins.dual.push(card);
    }
});

// Create output directory
const outputDir = path.join(__dirname, 'cards-by-domain');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Write each domain to a separate file
console.log('\nWriting domain files...');
Object.keys(domainBins).forEach(domain => {
    const cards = domainBins[domain];
    if (cards.length === 0) {
        console.log(`  ⊘ ${domain}: 0 cards (skipping)`);
        return;
    }

    const filename = path.join(outputDir, `${domain}-cards.json`);
    const data = {
        domain: domain,
        count: cards.length,
        cards: cards
    };

    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`  ✓ ${domain}: ${cards.length} cards → ${filename}`);
});

// Summary
console.log('\n=== Summary ===');
console.log(`Total cards processed: ${cards.length}`);
Object.keys(domainBins).forEach(domain => {
    console.log(`  ${domain}: ${domainBins[domain].length} cards`);
});

console.log('\n✓ Done! Files created in ./cards-by-domain/');
console.log('\nNext steps:');
console.log('1. Upload each JSON file to JSONBin.io');
console.log('2. Create a collection in JSONBin to group them');
console.log('3. Update config.js with the bin IDs');
