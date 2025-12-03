// Check legend card structure
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('card-gallery.json', 'utf8'));
const card = data.page.cards.items.find(c => c.publicCode === 'OGN-259/298');

console.log('\n=== Card OGN-259/298 Structure ===\n');
console.log('Name:', card.name);
console.log('Public Code:', card.publicCode);
console.log('\nCard Type:');
console.log(JSON.stringify(card.cardType, null, 2));
console.log('\nTag:');
console.log(JSON.stringify(card.tag, null, 2));
console.log('\nType:');
console.log(JSON.stringify(card.type, null, 2));
console.log('\nDomains:');
console.log(JSON.stringify(card.domain, null, 2));
