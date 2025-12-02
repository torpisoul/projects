const fs = require('fs');
const path = require('path');

console.log('Testing card-gallery.html parsing...');
const htmlPath = path.join(__dirname, '../card-gallery.html');
const html = fs.readFileSync(htmlPath, 'utf8');

console.log(`File size: ${html.length} characters`);

// Test different patterns
const tests = [
    { name: 'publicCode pattern', regex: /"publicCode":\s*"[^"]+"/g },
    { name: 'id ogn pattern', regex: /"id":\s*"ogn-[^"]+"/g },
    { name: 'cardImage url pattern', regex: /"cardImage":\s*\{[^}]*"url":\s*"[^"]+"/g }
];

for (const test of tests) {
    const matches = html.match(test.regex);
    console.log(`${test.name}: ${matches ? matches.length : 0} matches`);
    if (matches && matches.length > 0) {
        console.log(`  First match: ${matches[0].substring(0, 100)}`);
    }
}
