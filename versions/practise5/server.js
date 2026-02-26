const express = require('express');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const port = 3000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true
}));
app.use(express.json());

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *       properties:
 *         id:
 *           type: integer
 *           description: ID товара
 *         name:
 *           type: string
 *           description: Название товара
 *         category:
 *           type: string
 *           description: Категория товара
 *         description:
 *           type: string
 *           description: Описание товара
 *         price:
 *           type: number
 *           description: Цена товара
 *         stock:
 *           type: integer
 *           description: Количество на складе
 *         rating:
 *           type: number
 *           description: Рейтинг товара
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата добавления
 */

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Products API',
            version: '1.0.0',
            description: 'API для управления товарами интернет-магазина',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Сервер разработки'
            }
        ],
    },
    apis: ['./server.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ==================== ТОВАРЫ ====================
let products = [
    {
        id: 1,
        name: "Ноутбук ASUS ROG Strix",
        category: "Ноутбуки",
        description: "Игровой ноутбук с RTX 3060, 16GB RAM, 512GB SSD, 144Hz экран",
        price: 89990,
        stock: 5,
        rating: 4.8,
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        name: "Смартфон iPhone 15 Pro",
        category: "Смартфоны",
        description: "A17 Pro, 6.1' OLED, 256GB, титановый корпус",
        price: 119990,
        stock: 3,
        rating: 4.9,
        createdAt: new Date().toISOString()
    },
    {
        id: 3,
        name: "Наушники Sony WH-1000XM4",
        category: "Аксессуары",
        description: "Беспроводные наушники с активным шумоподавлением, 30ч работы",
        price: 24990,
        stock: 8,
        rating: 4.7,
        createdAt: new Date().toISOString()
    },
    {
        id: 4,
        name: "Монитор Samsung Odyssey G7",
        category: "Мониторы",
        description: "32' 4K, 144Hz, 1ms, изогнутый экран",
        price: 45990,
        stock: 2,
        rating: 4.6,
        createdAt: new Date().toISOString()
    },
    {
        id: 5,
        name: "Клавиатура Logitech G Pro X",
        category: "Аксессуары",
        description: "Механическая, TKL, переключатели GX Blue",
        price: 12990,
        stock: 10,
        rating: 4.5,
        createdAt: new Date().toISOString()
    },
    {
        id: 6,
        name: "Мышь Razer DeathAdder V3",
        category: "Аксессуары",
        description: "Оптическая, 30000 DPI, легкий дизайн 59г",
        price: 7990,
        stock: 15,
        rating: 4.7,
        createdAt: new Date().toISOString()
    },
    {
        id: 7,
        name: "Планшет iPad Pro 11",
        category: "Планшеты",
        description: "M2, 11' Liquid Retina, 128GB, поддержка Apple Pencil",
        price: 79990,
        stock: 4,
        rating: 4.8,
        createdAt: new Date().toISOString()
    },
    {
        id: 8,
        name: "SSD Samsung T7",
        category: "Хранение",
        description: "Внешний SSD 1TB, USB 3.2, до 1050MB/s",
        price: 8990,
        stock: 7,
        rating: 4.6,
        createdAt: new Date().toISOString()
    },
    {
        id: 9,
        name: "Часы Galaxy Watch 6",
        category: "Аксессуары",
        description: "44mm, GPS, измерение здоровья, 40ч работы",
        price: 26990,
        stock: 6,
        rating: 4.5,
        createdAt: new Date().toISOString()
    },
    {
        id: 10,
        name: "Роутер TP-Link Archer AX73",
        category: "Сеть",
        description: "Wi-Fi 6, 6 антенн, покрытие до 200м²",
        price: 11990,
        stock: 3,
        rating: 4.4,
        createdAt: new Date().toISOString()
    }
];

// ==================== CRUD ОПЕРАЦИИ ====================

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить все товары
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список всех товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Информация о товаре
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (!product) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               rating:
 *                 type: number
 *     responses:
 *       201:
 *         description: Товар создан
 *       400:
 *         description: Ошибка валидации
 */
app.post('/api/products', (req, res) => {
    const { name, category, description, price, stock, rating } = req.body;
    
    if (!name || !price) {
        return res.status(400).json({ message: 'Название и цена обязательны' });
    }

    const newProduct = {
        id: Date.now(),
        name,
        category: category || "Разное",
        description: description || "",
        price,
        stock: stock || 0,
        rating: rating || 5.0,
        createdAt: new Date().toISOString()
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Полностью обновить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               rating:
 *                 type: number
 *     responses:
 *       200:
 *         description: Товар обновлен
 *       404:
 *         description: Товар не найден
 */
app.put('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (!product) {
        return res.status(404).json({ message: 'Товар не найден' });
    }

    const { name, category, description, price, stock, rating } = req.body;
    
    if (name) product.name = name;
    if (category) product.category = category;
    if (description) product.description = description;
    if (price) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (rating) product.rating = rating;
    
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Частично обновить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Товар обновлен
 *       404:
 *         description: Товар не найден
 */
app.patch('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (!product) {
        return res.status(404).json({ message: 'Товар не найден' });
    }

    const { name, price, stock } = req.body;
    
    if (name) product.name = name;
    if (price) product.price = price;
    if (stock !== undefined) product.stock = stock;
    
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Товар удален
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', (req, res) => {
    const initialLength = products.length;
    products = products.filter(p => p.id != req.params.id);
    
    if (products.length === initialLength) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    
    res.json({ message: 'Товар удален' });
});

// ==================== ДОПОЛНИТЕЛЬНЫЕ МАРШРУТЫ ====================

/**
 * @swagger
 * /api/products/category/{category}:
 *   get:
 *     summary: Получить товары по категории
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товары категории
 */
app.get('/api/products/category/:category', (req, res) => {
    const categoryProducts = products.filter(p => 
        p.category.toLowerCase() === req.params.category.toLowerCase()
    );
    res.json(categoryProducts);
});

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Поиск товаров
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Поисковый запрос
 *     responses:
 *       200:
 *         description: Результаты поиска
 */
app.get('/api/search', (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.json([]);
    }
    
    const results = products.filter(p => 
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.description.toLowerCase().includes(q.toLowerCase()) ||
        p.category.toLowerCase().includes(q.toLowerCase())
    );
    res.json(results);
});

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Получить статистику по товарам
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Статистика
 */
app.get('/api/stats', (req, res) => {
    const stats = {
        total: products.length,
        categories: [...new Set(products.map(p => p.category))].length,
        totalStock: products.reduce((sum, p) => sum + p.stock, 0),
        averagePrice: Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length),
        minPrice: Math.min(...products.map(p => p.price)),
        maxPrice: Math.max(...products.map(p => p.price))
    };
    res.json(stats);
});

// ==================== ЗАПУСК СЕРВЕРА ====================

app.listen(port, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🛍️  МАГАЗИН - СЕРВЕР ЗАПУЩЕН');
    console.log('='.repeat(60));
    console.log(`📡 API: http://localhost:${port}/api/products`);
    console.log(`📚 Swagger: http://localhost:${port}/api-docs`);
    console.log('='.repeat(60));
    console.log('📋 Доступные эндпоинты:');
    console.log('   GET    /api/products              - все товары');
    console.log('   GET    /api/products/:id          - товар по ID');
    console.log('   GET    /api/products/category/:cat- по категории');
    console.log('   GET    /api/search?q=текст        - поиск');
    console.log('   GET    /api/stats                  - статистика');
    console.log('   POST   /api/products               - создать товар');
    console.log('   PUT    /api/products/:id           - обновить товар');
    console.log('   PATCH  /api/products/:id           - частично обновить');
    console.log('   DELETE /api/products/:id           - удалить товар');
    console.log('='.repeat(60));
    console.log(`📦 Товаров в базе: ${products.length}`);
    console.log(`📊 Категорий: ${[...new Set(products.map(p => p.category))].length}`);
    console.log('='.repeat(60) + '\n');
});