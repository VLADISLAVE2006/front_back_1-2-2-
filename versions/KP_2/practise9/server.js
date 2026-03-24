const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ВоенТорг API',
            version: '1.0.0',
            description: 'API для магазина военного снаряжения',
            contact: {
                name: 'Разработчик'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Локальный сервер'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        email: { type: 'string', example: 'admin@military.ru' },
                        first_name: { type: 'string', example: 'Админ' },
                        last_name: { type: 'string', example: 'Системы' }
                    }
                },
                Product: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        title: { type: 'string', example: 'Тактический бронежилет' },
                        category: { type: 'string', example: 'Бронезащита' },
                        description: { type: 'string', example: 'Класс защиты Бр4, керамические пластины' },
                        price: { type: 'number', example: 45000 },
                        userId: { type: 'integer', example: 1 }
                    }
                },
                TokenResponse: {
                    type: 'object',
                    properties: {
                        accessToken: { 
                            type: 'string', 
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
                        },
                        refreshToken: { 
                            type: 'string', 
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
                        },
                        user: {
                            $ref: '#/components/schemas/User'
                        }
                    }
                }
            }
        }
    },
    apis: ['./server.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "ВоенТорг API Documentation"
}));

// In-memory базы данных
let users = [];
let refreshTokens = []; // Хранилище для refresh токенов
let products = [
    {
        id: 1,
        title: "Тактический бронежилет",
        category: "Бронезащита",
        description: "Класс защиты Бр4, керамические пластины, регулируемый",
        price: 45000,
        userId: 1
    },
    {
        id: 2,
        title: "Шлем тактический",
        category: "Защита головы",
        description: "Класс защиты Бр2, легкий композит, система креплений",
        price: 18000,
        userId: 1
    },
    {
        id: 3,
        title: "Разгрузочная система",
        category: "Амуниция",
        description: "MOLLE система, 5 точек крепления, быстросъемная",
        price: 8500,
        userId: 1
    },
    {
        id: 4,
        title: "Тактические ботинки",
        category: "Экипировка",
        description: "Высокие, мембрана Gore-Tex, стальной подносок",
        price: 12000,
        userId: 1
    }
];
let currentId = 5;

// Создаем тестового пользователя
async function createTestUser() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    users.push({
        id: 1,
        email: 'admin@military.ru',
        first_name: 'Админ',
        last_name: 'Системы',
        password: hashedPassword
    });
    console.log('Тестовый пользователь создан: admin@military.ru / admin123');
}
createTestUser();

// Middleware для проверки JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Авторизация]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - first_name
 *               - last_name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               first_name:
 *                 type: string
 *                 example: Иван
 *               last_name:
 *                 type: string
 *                 example: Петров
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Ошибка в запросе
 */
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, first_name, last_name, password } = req.body;

        if (!email || !first_name || !last_name || !password) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            id: users.length + 1,
            email,
            first_name,
            last_name,
            password: hashedPassword
        };

        users.push(user);
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Авторизация]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@military.ru
 *               password:
 *                 type: string
 *                 example: "admin123"
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         description: Неверные учетные данные
 */
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        // Генерируем access token (короткоживущий)
        const accessToken = jwt.sign(
            { id: user.id, email: user.email, name: `${user.first_name} ${user.last_name}` },
            process.env.JWT_SECRET,
            { expiresIn: '15m' } // Access token живет 15 минут
        );

        // Генерируем refresh token (долгоживущий)
        const refreshToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // Refresh token живет 7 дней
        );

        // Сохраняем refresh token в памяти (в реальном проекте - в БД)
        refreshTokens.push({
            token: refreshToken,
            userId: user.id,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 дней
        });

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновить пару токенов
 *     tags: [Авторизация]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Токены успешно обновлены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         description: Недействительный refresh token
 *       403:
 *         description: Refresh token истек или не найден
 */
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token обязателен' });
        }

        // Проверяем, существует ли токен в хранилище
        const storedToken = refreshTokens.find(t => t.token === refreshToken);
        if (!storedToken) {
            return res.status(403).json({ error: 'Refresh token не найден' });
        }

        // Проверяем, не истек ли токен
        if (storedToken.expiresAt < Date.now()) {
            // Удаляем истекший токен
            refreshTokens = refreshTokens.filter(t => t.token !== refreshToken);
            return res.status(403).json({ error: 'Refresh token истек' });
        }

        // Верифицируем токен
        jwt.verify(refreshToken, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                // Если токен недействителен, удаляем его из хранилища
                refreshTokens = refreshTokens.filter(t => t.token !== refreshToken);
                return res.status(403).json({ error: 'Недействительный refresh token' });
            }

            // Находим пользователя
            const foundUser = users.find(u => u.id === user.id);
            if (!foundUser) {
                return res.status(404).json({ error: 'Пользователь не найден' });
            }

            // Генерируем новую пару токенов
            const newAccessToken = jwt.sign(
                { id: foundUser.id, email: foundUser.email, name: `${foundUser.first_name} ${foundUser.last_name}` },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            const newRefreshToken = jwt.sign(
                { id: foundUser.id, email: foundUser.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Удаляем старый refresh token
            refreshTokens = refreshTokens.filter(t => t.token !== refreshToken);

            // Сохраняем новый refresh token
            refreshTokens.push({
                token: newRefreshToken,
                userId: foundUser.id,
                expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                user: {
                    id: foundUser.id,
                    email: foundUser.email,
                    first_name: foundUser.first_name,
                    last_name: foundUser.last_name
                }
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить информацию о текущем пользователе
 *     tags: [Авторизация]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Информация о пользователе
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован
 */
app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Выход из системы (удаление refresh токена)
 *     tags: [Авторизация]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный выход
 *       400:
 *         description: Refresh token не предоставлен
 */
app.post('/api/auth/logout', (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token не предоставлен' });
    }

    // Удаляем refresh token из хранилища
    refreshTokens = refreshTokens.filter(t => t.token !== refreshToken);
    
    res.json({ message: 'Успешный выход из системы' });
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Товары]
 *     responses:
 *       200:
 *         description: Список товаров
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
 *     tags: [Товары]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Товары]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Тактический бронежилет"
 *               category:
 *                 type: string
 *                 example: "Бронезащита"
 *               description:
 *                 type: string
 *                 example: "Класс защиты Бр4, керамические пластины"
 *               price:
 *                 type: number
 *                 example: 45000
 *     responses:
 *       201:
 *         description: Товар создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         description: Не авторизован
 */
app.post('/api/products', authenticateToken, (req, res) => {
    try {
        const { title, category, description, price } = req.body;

        if (!title || !category || !description || !price) {
            return res.status(400).json({ error: 'Заполните обязательные поля' });
        }

        const product = {
            id: currentId++,
            title,
            category,
            description,
            price: parseFloat(price),
            userId: req.user.id
        };

        products.push(product);
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар
 *     tags: [Товары]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Товар обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Товар не найден
 */
app.put('/api/products/:id', authenticateToken, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const productIndex = products.findIndex(p => p.id === id);

        if (productIndex === -1) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        const { title, category, description, price } = req.body;

        products[productIndex] = {
            ...products[productIndex],
            title: title || products[productIndex].title,
            category: category || products[productIndex].category,
            description: description || products[productIndex].description,
            price: price ? parseFloat(price) : products[productIndex].price
        };

        res.json(products[productIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Товары]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Товар удален
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Товар не найден' });
    }

    products.splice(productIndex, 1);
    res.status(200).json({ message: 'Товар удален' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Swagger UI доступен по адресу: http://localhost:${PORT}/api-docs`);
    console.log(`Тестовый вход: admin@military.ru / admin123`);
});