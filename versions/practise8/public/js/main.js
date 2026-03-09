const API_URL = 'http://localhost:3000/api';

// Загрузка товаров при открытии страницы
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    checkAuth();
    setupEventListeners();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    const loginLink = document.getElementById('loginLink');
    const adminLink = document.getElementById('adminLink');
    const logoutBtn = document.getElementById('logoutBtn');

    if (token) {
        if (loginLink) loginLink.style.display = 'none';
        if (adminLink) adminLink.style.display = 'inline';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';

        fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(user => {
                if (user.error) {
                    localStorage.removeItem('token');
                    location.reload();
                }
            });
    } else {
        if (loginLink) loginLink.style.display = 'inline';
        if (adminLink) adminLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

function setupEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showNotification('Вы вышли из системы', 'success');
            setTimeout(() => {
                location.href = '/';
            }, 1000);
        });
    }

    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        showNotification('Ошибка загрузки товаров', 'error');
    }
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = '<p class="no-products">Товары не найдены</p>';
        return;
    }

    grid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <div class="product-category">${product.category}</div>
                <p class="product-description">${product.description}</p>
                <div class="product-price">${product.price.toLocaleString()} ₽</div>
            </div>
        </div>
    `).join('');
}

function filterProducts() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';

    fetch(`${API_URL}/products`)
        .then(res => res.json())
        .then(products => {
            const filtered = products.filter(product => {
                const matchesSearch = product.title.toLowerCase().includes(searchTerm) ||
                    product.description.toLowerCase().includes(searchTerm);
                const matchesCategory = !category || product.category === category;
                return matchesSearch && matchesCategory;
            });
            displayProducts(filtered);
        });
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}