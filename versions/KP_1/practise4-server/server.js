const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true
}));
app.use(express.json());

// Путь к файлу с данными
const DATA_FILE = path.join(__dirname, 'data', 'products.json');

// Функция для чтения данных из файла
const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Ошибка чтения файла данных:', err);
        return { products: [] };
    }
};

// Функция для записи данных в файл
const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('Ошибка записи в файл:', err);
        return false;
    }
};

// Инициализация данных
let data = readData();
let products = data.products;
let cart = []; // Корзина в памяти (можно тоже сохранять в файл при желании)

// ==================== ТОВАРЫ ====================

// Получить все товары
app.get('/api/products', (req, res) => {
    res.json({
        success: true,
        data: products
    });
});

// Получить товар по ID
app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    
    if (!product) {
        return res.status(404).json({ 
            success: false,
            message: 'Товар не найден' 
        });
    }
    
    res.json({
        success: true,
        data: product
    });
});

// Получить товары по категории
app.get('/api/products/category/:category', (req, res) => {
    const categoryProducts = products.filter(p => 
        p.category.toLowerCase() === req.params.category.toLowerCase()
    );
    
    res.json({
        success: true,
        data: categoryProducts,
        count: categoryProducts.length
    });
});

// Поиск товаров
app.get('/api/search', (req, res) => {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
        return res.json({
            success: true,
            data: [],
            message: 'Пустой поисковый запрос'
        });
    }
    
    const searchTerm = q.toLowerCase().trim();
    const results = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm)
    );
    
    res.json({
        success: true,
        data: results,
        count: results.length,
        query: q
    });
});

// ==================== КОРЗИНА ====================

// Получить корзину
app.get('/api/cart', (req, res) => {
    res.json({
        success: true,
        data: cart,
        total: cart.reduce((sum, item) => sum + item.quantity, 0)
    });
});

// Добавить в корзину
app.post('/api/cart', (req, res) => {
    const { productId, quantity = 1 } = req.body;
    
    const product = products.find(p => p.id === productId);
    if (!product) {
        return res.status(404).json({ 
            success: false,
            message: 'Товар не найден' 
        });
    }
    
    if (product.stock < quantity) {
        return res.status(400).json({ 
            success: false,
            message: 'Недостаточно товара на складе',
            available: product.stock
        });
    }
    
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        if (existingItem.quantity + quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: 'Превышено доступное количество',
                available: product.stock - existingItem.quantity
            });
        }
        existingItem.quantity += quantity;
    } else {
        cart.push({ 
            productId, 
            quantity,
            addedAt: new Date().toISOString()
        });
    }
    
    res.status(201).json({
        success: true,
        data: cart,
        message: 'Товар добавлен в корзину'
    });
});

// Обновить количество товара в корзине
app.put('/api/cart/:productId', (req, res) => {
    const productId = parseInt(req.params.productId);
    const { quantity } = req.body;
    
    if (quantity < 0) {
        return res.status(400).json({
            success: false,
            message: 'Количество не может быть отрицательным'
        });
    }
    
    const itemIndex = cart.findIndex(item => item.productId === productId);
    if (itemIndex === -1) {
        return res.status(404).json({ 
            success: false,
            message: 'Товар не найден в корзине' 
        });
    }
    
    if (quantity === 0) {
        cart.splice(itemIndex, 1);
        return res.json({
            success: true,
            data: cart,
            message: 'Товар удален из корзины'
        });
    }
    
    const product = products.find(p => p.id === productId);
    if (quantity > product.stock) {
        return res.status(400).json({ 
            success: false,
            message: 'Недостаточно товара на складе',
            available: product.stock
        });
    }
    
    cart[itemIndex].quantity = quantity;
    cart[itemIndex].updatedAt = new Date().toISOString();
    
    res.json({
        success: true,
        data: cart,
        message: 'Количество обновлено'
    });
});

// Удалить товар из корзины
app.delete('/api/cart/:productId', (req, res) => {
    const productId = parseInt(req.params.productId);
    const initialLength = cart.length;
    
    cart = cart.filter(item => item.productId !== productId);
    
    if (cart.length === initialLength) {
        return res.status(404).json({
            success: false,
            message: 'Товар не найден в корзине'
        });
    }
    
    res.json({
        success: true,
        data: cart,
        message: 'Товар удален из корзины'
    });
});

// Очистить корзину
app.delete('/api/cart', (req, res) => {
    cart = [];
    res.json({
        success: true,
        message: 'Корзина очищена'
    });
});

// ==================== СТАТИСТИКА ====================

// Получить статистику магазина
app.get('/api/stats', (req, res) => {
    const stats = {
        totalProducts: products.length,
        totalCategories: [...new Set(products.map(p => p.category))].length,
        totalStock: products.reduce((sum, p) => sum + p.stock, 0),
        averagePrice: Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length),
        cartSize: cart.length,
        cartTotal: cart.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            return sum + (product?.price || 0) * item.quantity;
        }, 0)
    };
    
    res.json({
        success: true,
        data: stats
    });
});

// Получить популярные товары (по рейтингу)
app.get('/api/products/popular/:limit?', (req, res) => {
    const limit = parseInt(req.params.limit) || 5;
    
    const popular = [...products]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit);
    
    res.json({
        success: true,
        data: popular,
        limit
    });
});

// Получить товары в наличии
app.get('/api/products/in-stock', (req, res) => {
    const inStock = products.filter(p => p.stock > 0);
    
    res.json({
        success: true,
        data: inStock,
        count: inStock.length
    });
});

// Получить категории с количеством товаров
app.get('/api/categories', (req, res) => {
    const categories = {};
    
    products.forEach(product => {
        if (!categories[product.category]) {
            categories[product.category] = {
                name: product.category,
                count: 0,
                totalStock: 0
            };
        }
        categories[product.category].count++;
        categories[product.category].totalStock += product.stock;
    });
    
    res.json({
        success: true,
        data: Object.values(categories)
    });
});

// ==================== АДМИНИСТРИРОВАНИЕ ====================

// Добавить новый товар
app.post('/api/admin/products', (req, res) => {
    const { name, category, description, price, stock, rating, image } = req.body;
    
    if (!name || !category || !description || !price || stock === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Заполните все обязательные поля'
        });
    }
    
    const newProduct = {
        id: products.length + 1,
        name,
        category,
        description,
        price: Number(price),
        stock: Number(stock),
        rating: rating ? Number(rating) : 5.0,
        image: image || `https://via.placeholder.com/200x200?text=${encodeURIComponent(name)}`
    };
    
    products.push(newProduct);
    
    // Сохраняем в файл
    writeData({ products });
    
    res.status(201).json({
        success: true,
        data: newProduct,
        message: 'Товар добавлен'
    });
});

// Обновить товар
app.put('/api/admin/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: 'Товар не найден'
        });
    }
    
    products[index] = {
        ...products[index],
        ...req.body,
        id
    };
    
    // Сохраняем в файл
    writeData({ products });
    
    res.json({
        success: true,
        data: products[index],
        message: 'Товар обновлен'
    });
});

// Удалить товар
app.delete('/api/admin/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const initialLength = products.length;
    
    products = products.filter(p => p.id !== id);
    
    if (products.length === initialLength) {
        return res.status(404).json({
            success: false,
            message: 'Товар не найден'
        });
    }
    
    // Сохраняем в файл
    writeData({ products });
    
    res.json({
        success: true,
        message: 'Товар удален'
    });
});

// ==================== ЗАПУСК СЕРВЕРА ====================

app.listen(port, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🛍️  ИНТЕРНЕТ-МАГАЗИН - СЕРВЕР ЗАПУЩЕН');
    console.log('='.repeat(50));
    console.log(`📍 Адрес: http://localhost:${port}`);
    console.log(`📁 Данные загружены из: data/products.json`);
    console.log(`📦 API Endpoints:`);
    console.log(`   • GET  /api/products - все товары`);
    console.log(`   • GET  /api/products/:id - товар по ID`);
    console.log(`   • GET  /api/products/category/:category - по категории`);
    console.log(`   • GET  /api/search?q=текст - поиск`);
    console.log(`   • GET  /api/categories - все категории`);
    console.log(`   • GET  /api/cart - корзина`);
    console.log(`   • POST /api/cart - добавить в корзину`);
    console.log(`   • PUT  /api/cart/:id - обновить количество`);
    console.log(`   • DEL  /api/cart/:id - удалить из корзины`);
    console.log('='.repeat(50));
    console.log(`📊 Статистика:`);
    console.log(`   • Товаров: ${products.length}`);
    console.log(`   • Категорий: ${[...new Set(products.map(p => p.category))].length}`);
    console.log(`   • Товаров в наличии: ${products.filter(p => p.stock > 0).length}`);
    console.log('='.repeat(50) + '\n');
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
    });
});

// 404 для несуществующих маршрутов
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Маршрут не найден'
    });
});