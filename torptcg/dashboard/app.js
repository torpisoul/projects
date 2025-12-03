// Dashboard Logic

const API_URL = '/.netlify/functions/inventory';
let products = [];
let currentMode = 'add'; // 'add' or 'edit'

// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const dashboard = document.querySelector('.dashboard-container');
const loginBtn = document.getElementById('login-btn');
const adminKeyInput = document.getElementById('admin-key-input');
const tableBody = document.getElementById('table-body');
const modal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const addBtn = document.getElementById('add-product-btn');
const cancelBtn = document.getElementById('cancel-modal');
const refreshBtn = document.getElementById('refresh-btn');
const imageInput = document.getElementById('p-image');
const imagePreview = document.getElementById('image-preview');

// 1. Authentication (Simple Client-Side for now)
function checkAuth() {
    const key = localStorage.getItem('torptcg_admin_key');
    if (key) {
        showDashboard();
    }
}

loginBtn.addEventListener('click', () => {
    const key = adminKeyInput.value.trim();
    if (key) {
        localStorage.setItem('torptcg_admin_key', key);
        showDashboard();
    }
});

function showDashboard() {
    loginOverlay.style.display = 'none';
    dashboard.style.display = 'block';
    loadInventory();
}

// 2. Load Inventory
async function loadInventory() {
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading...</td></tr>';

    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        // Handle different data structures
        products = Array.isArray(data) ? data : (data.products || []);

        renderTable();
    } catch (err) {
        console.error(err);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--danger);">Failed to load inventory</td></tr>';
    }
}

// 3. Render Table
function renderTable() {
    tableBody.innerHTML = '';

    if (products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No products found. Add one!</td></tr>';
        return;
    }

    products.forEach(p => {
        const tr = document.createElement('tr');

        const stockClass = p.stock > 5 ? 'badge-stock' : (p.stock > 0 ? 'badge-low' : 'badge-out');
        const stockText = p.stock > 0 ? 'In Stock' : (p.preOrder ? 'Made to Order' : 'Out of Stock');

        tr.innerHTML = `
            <td><img src="${p.image}" class="product-thumb" alt=""></td>
            <td><strong>${p.title}</strong><br><span style="font-size:0.8em; color:var(--text-muted)">${p.id}</span></td>
            <td>${p.category}</td>
            <td>£${parseFloat(p.price).toFixed(2)}</td>
            <td>${p.stock}</td>
            <td><span class="badge ${stockClass}">${stockText}</span></td>
            <td>
                <button class="btn-edit" onclick="openEditModal('${p.id}')">Edit</button>
                <button class="btn-danger" onclick="deleteProduct('${p.id}')">Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// 4. Modal Handling
addBtn.addEventListener('click', () => {
    currentMode = 'add';
    document.getElementById('modal-title').textContent = 'Add Product';
    productForm.reset();
    document.getElementById('product-id').value = '';
    imagePreview.style.display = 'none';
    modal.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
});

// Expose to window for onclick events
window.openEditModal = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;

    currentMode = 'edit';
    document.getElementById('modal-title').textContent = 'Edit Product';

    document.getElementById('product-id').value = p.id;
    document.getElementById('p-title').value = p.title;
    document.getElementById('p-category').value = p.category;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-stock').value = p.stock;
    document.getElementById('p-preorder').checked = p.preOrder || false;
    document.getElementById('p-image').value = p.image;

    updateImagePreview(p.image);

    modal.classList.remove('hidden');
};

imageInput.addEventListener('input', (e) => {
    updateImagePreview(e.target.value);
});

function updateImagePreview(url) {
    if (url) {
        imagePreview.style.backgroundImage = `url('${url}')`;
        imagePreview.style.display = 'block';
    } else {
        imagePreview.style.display = 'none';
    }
}

// 5. Form Submission (Add/Edit)
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('save-product');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    const productData = {
        id: document.getElementById('product-id').value || undefined,
        title: document.getElementById('p-title').value,
        category: document.getElementById('p-category').value,
        price: parseFloat(document.getElementById('p-price').value),
        stock: parseInt(document.getElementById('p-stock').value),
        preOrder: document.getElementById('p-preorder').checked,
        image: document.getElementById('p-image').value
    };

    const action = currentMode === 'add' ? 'create' : 'update';

    try {
        // For new products, we need to specify the target bin
        // Sealed, accessories, and prints go to the products bin
        const binId = '692ec5feae596e708f7e5206'; // torptcg-products bin

        const res = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: action,
                product: productData,
                binId: binId // Important: Tell inventory.js where to save details
            })
        });

        const result = await res.json();

        if (res.ok) {
            modal.classList.add('hidden');
            loadInventory(); // Refresh table
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Network Error');
        console.error(err);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// 6. Delete
window.deleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) return;

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'delete',
                productId: id,
                binId: '692ec5feae596e708f7e5206' // torptcg-products bin
            })
        });

        if (res.ok) {
            loadInventory();
        } else {
            alert('Failed to delete');
        }
    } catch (err) {
        console.error(err);
        alert('Network Error');
    }
};

refreshBtn.addEventListener('click', loadInventory);

// Init
checkAuth();
