// Script to populate card-inventory.json with all cards from domain bins
// Run this with: node populate-inventory.js

const fs = require('fs');
const path = require('path');

console.log('🔄 Populating card inventory from domain bins...\n');

// Read all card domain files
const domainFiles = [
    'cards-by-domain/body-cards.json',
    'cards-by-domain/calm-cards.json',
    'cards-by-domain/chaos-cards.json',
    'cards-by-domain/fury-cards.json',
    'cards-by-domain/mind-cards.json',
    'cards-by-domain/order-cards.json',
    'cards-by-domain/rainbow-cards.json'
];

const inventory = [];
let totalCards = 0;

domainFiles.forEach(file => {
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${file} (not found)`);
        return;
    }

    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const cards = data.cards || [];

        console.log(`📦 Processing ${file}: ${cards.length} cards`);

        cards.forEach(card => {
            if (card.id) {
                inventory.push({
                    cardId: card.id,
                    stock: 0
                });
                totalCards++;
            }
        });
    } catch (error) {
        console.error(`❌ Error reading ${file}:`, error.message);
    }
});

// Create the inventory JSON
const inventoryData = {
    inventory: inventory
};

// Write to card-inventory.json
const outputPath = path.join(__dirname, 'card-inventory.json');
fs.writeFileSync(outputPath, JSON.stringify(inventoryData, null, 2));

console.log(`\n✅ Successfully created card-inventory.json`);
console.log(`📊 Total cards: ${totalCards}`);
console.log(`📁 File: ${outputPath}`);
console.log(`\n🚀 Next steps:`);
console.log(`   1. Upload card-inventory.json to JSONBin`);
console.log(`   2. Update the bin ID in netlify/functions/card-inventory.js`);
console.log(`   3. Restart your server`);
