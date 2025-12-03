# Your Code is Already Correct!

The 'All' filter logic is working as intended:

```javascript
// Line 118: Only show in-stock items by default
let products = showOutOfStock ? allProducts : allProducts.filter(p => p.stock > 0 || p.preOrder);

// Line 120: 'all' shows all those in-stock products
const filteredProducts = filter === 'all' ? products : products.filter(p => p.category === filter);
```

## The Real Issue

Your JSONBin products probably have `stock: 0` or the stock field is missing.

## Solution: Add Stock to Your Products

1. Go to JSONBin.io
2. Open your bin: `692ec5feae596e708f7e5206` (torptcg-products)
3. Make sure your products have `stock` greater than 0:

```json
{
  "products": [
    {
      "id": "test-001",
      "title": "Test Sealed Product",
      "category": "sealed",
      "price": 25.99,
      "image": "https://via.placeholder.com/300x400",
      "stock": 10,  ← MUST BE > 0
      "available": true,
      "preOrder": false
    }
  ]
}
```

4. Save the bin
5. Refresh your page (http://localhost:8888)

## To Test:
- **Initial load**: Should show all products with stock > 0
- **Toggle "Show out-of-stock"**: Should add products with stock = 0
- **Click "Singles"**: Should show card search
- **Click "Sealed"**: Should show only sealed products

The code is working correctly - you just need products with stock!
