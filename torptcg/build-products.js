const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const productsDir = path.join(__dirname, 'products');
const outputFile = path.join(__dirname, 'products-data.json');

// Read all markdown files from products directory
const products = [];

if (fs.existsSync(productsDir)) {
    const files = fs.readdirSync(productsDir).filter(file => file.endsWith('.md'));

    files.forEach((file, index) => {
        const filePath = path.join(productsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(fileContent);

        products.push({
            id: index + 1,
            title: data.title,
            category: data.category,
            price: data.price,
            image: data.image,
            stock: data.stock,
            description: data.description || '',
            featured: data.featured || false
        });
    });
}

// Write to JSON file
fs.writeFileSync(outputFile, JSON.stringify(products, null, 2));
console.log(`✅ Generated products-data.json with ${products.length} products`);
