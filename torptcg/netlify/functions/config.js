// config.js for Netlify Functions
// Export the external JSON store URL used by the products function.
// IMPORTANT: Set JSONBIN_API_KEY in Netlify environment variables or .env file

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
const JSONBIN_INVENTORY_BIN = process.env.JSONBIN_INVENTORY_BIN || "https://api.jsonbin.io/v3/b/6927370eae596e708f7294be";

if (!JSONBIN_API_KEY) {
    console.warn('⚠️  WARNING: JSONBIN_API_KEY not set in environment variables.');
    console.warn('   Create a .env file in the project root with:');
    console.warn('   JSONBIN_API_KEY=your_api_key_here');
}

module.exports = {
    EXTERNAL_JSON_URL: JSONBIN_INVENTORY_BIN,
    JSONBIN_API_KEY: JSONBIN_API_KEY,
    MASTER_INVENTORY_BIN_ID: process.env.MASTER_INVENTORY_BIN_ID || null,

    // Card gallery bin - update this after uploading card-gallery.json to JSONBin
    // See MANUAL-UPLOAD-GUIDE.md for instructions
    CARD_GALLERY_BIN: process.env.CARD_GALLERY_BIN || null // Set this to your bin URL after upload
};
