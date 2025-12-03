// DEBUG: Add this temporarily to cards-script.js in the createCardElement function
// Add right after line 261 (after const domainId = ...)

console.log('Card:', card.name);
console.log('Domain object:', card.domain);
console.log('Domain values:', card.domain?.values);
console.log('Domain ID:', domainId);
console.log('---');

// This will help us see:
// 1. If card.domain exists
// 2. What structure it has
// 3. If the ID is being extracted correctly

// INSTRUCTIONS:
// 1. Add these console.log lines after line 261 in cards-script.js
// 2. Save the file
// 3. Refresh your browser
// 4. Open browser console (F12)
// 5. Click on "Singles" filter
// 6. Look at the console output
// 7. Share what you see - especially the "Domain object" and "Domain ID" lines

// Once we see the output, we can fix the path to access the domain ID correctly!
