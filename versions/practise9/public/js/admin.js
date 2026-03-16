const API_URL = 'http://localhost:3000/api';

// Проверка авторизации
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('userName').textContent = `${user.first_name || ''} ${user.last_name || ''}`;

    loadAdminProducts();
    setupAdminEventListeners();
});

function setupAdminEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });

    document.getElementById('showAddFormBtn').addEventListener('click', () => {
        showProductForm();
    });
}

async function loadAdminProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        displayAdminProducts(products);
    } catch (error) {
        showNotification('Ошибка загрузки товаров', 'error');
    }
}

function displayAdminProducts(products) {
    const container = document.getElementById('productsList');

    if (products.length === 0) {
        container.innerHTML = '<p>Товаров пока нет</p>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="admin-product-card">
            <h4>${product.title}</h4>
            <p class="product-category">${product.category}</p>
            <p class="product-description">${product.description.substring(0, 50)}${product.description.length > 50 ? '...' : ''}</p>
            <p class="price">${product.price.toLocaleString()} ₽</p>
            <div class="admin-product-actions">
                <button onclick="editProduct(${product.id})" class="btn-edit">✏️ Редактировать</button>
                <button onclick="deleteProduct(${product.id})" class="btn-delete">🗑️ Удалить</button>
            </div>
        </div>
    `).join('');
}

function showProductForm(product = null) {
    const form = document.getElementById('productForm');
    const formTitle = document.getElementById('formTitle');
    const showBtn = document.getElementById('showAddFormBtn');

    form.style.display = 'block';
    showBtn.style.display = 'none';

    if (product) {
        formTitle.textContent = 'Редактирование товара';
        document.getElementById('productId').value = product.id;
        document.getElementById('title').value = product.title;
        document.getElementById('category').value = product.category;
        document.getElementById('description').value = product.description;
        document.getElementById('price').value = product.price;
    } else {
        formTitle.textContent = 'Добавление товара';
        document.getElementById('productId').value = '';
        document.getElementById('title').value = '';
        document.getElementById('category').value = '';
        document.getElementById('description').value = '';
        document.getElementById('price').value = '';
    }
}

function cancelForm() {
    document.getElementById('productForm').style.display = 'none';
    document.getElementById('showAddFormBtn').style.display = 'inline-block';
}

async function saveProduct(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const id = document.getElementById('productId').value;
    const productData = {
        title: document.getElementById('title').value,
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        price: parseFloat(document.getElementById('price').value)
    };

    try {
        const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            showNotification(id ? 'Товар обновлен' : 'Товар добавлен', 'success');
            cancelForm();
            loadAdminProducts();
            // Обновляем главную страницу если она открыта
            if (window.opener) {
                window.opener.location.reload();
            }
        } else {
            const error = await response.json();
            showNotification(error.error || 'Ошибка сохранения', 'error');
        }
    } catch (error) {
        showNotification('Ошибка сервера', 'error');
    }
}

async function editProduct(id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        const product = await response.json();
        showProductForm(product);
    } catch (error) {
        showNotification('Ошибка загрузки товара', 'error');
    }
}

async function deleteProduct(id) {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showNotification('Товар удален', 'success');
            loadAdminProducts();
            if (window.opener) {
                window.opener.location.reload();
            }
        } else {
            const error = await response.json();
            showNotification(error.error || 'Ошибка удаления', 'error');
        }
    } catch (error) {
        showNotification('Ошибка сервера', 'error');
    }
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