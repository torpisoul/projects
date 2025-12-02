// config.js for Netlify Functions
// Export the external JSON store URL used by the products function.
module.exports = {
    EXTERNAL_JSON_URL: "https://api.jsonbin.io/v3/b/6927370eae596e708f7294be",
    JSONBIN_API_KEY: "$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a",

    // Card gallery bin - update this after uploading card-gallery.json to JSONBin
    // See MANUAL-UPLOAD-GUIDE.md for instructions
    CARD_GALLERY_BIN: process.env.CARD_GALLERY_BIN || null // Set this to your bin URL after upload
};
