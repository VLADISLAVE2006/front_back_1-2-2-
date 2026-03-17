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
            description: 'API для магазина военного снаряжения с системой ролей',
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
                        last_name: { type: 'string', example: 'Системы' },
                        role: {
                            type: 'string',
                            enum: ['user', 'seller', 'admin'],
                            example: 'admin'
                        },
                        isBlocked: { type: 'boolean', example: false }
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
let users = [
    {
        id: 1,
        email: 'admin@military.ru',
        first_name: 'Админ',
        last_name: 'Системы',
        role: 'admin',
        isBlocked: false,
        password: '$2a$10$YourHashedPasswordHere' // Будет заменено при создании
    },
    {
        id: 2,
        email: 'seller@military.ru',
        first_name: 'Иван',
        last_name: 'Петров',
        role: 'seller',
        isBlocked: false,
        password: '$2a$10$YourHashedPasswordHere'
    },
    {
        id: 3,
        email: 'user@example.com',
        first_name: 'Петр',
        last_name: 'Сидоров',
        role: 'user',
        isBlocked: false,
        password: '$2a$10$YourHashedPasswordHere'
    }
];

let refreshTokens = [];
let products = [
    {
        id: 1,
        title: "Тактический бронежилет",
        category: "Бронезащита",
        description: "Класс защиты Бр4, керамические пластины, регулируемый",
        price: 45000,
        userId: 2 // Создано продавцом
    },
    {
        id: 2,
        title: "Шлем тактический",
        category: "Защита головы",
        description: "Класс защиты Бр2, легкий композит, система креплений",
        price: 18000,
        userId: 2
    },
    {
        id: 3,
        title: "Разгрузочная система",
        category: "Амуниция",
        description: "MOLLE система, 5 точек крепления, быстросъемная",
        price: 8500,
        userId: 2
    },
    {
        id: 4,
        title: "Тактические ботинки",
        category: "Экипировка",
        description: "Высокие, мембрана Gore-Tex, стальной подносок",
        price: 12000,
        userId: 2
    }
];
let currentId = 5;

// Создаем тестовых пользователей с хешированными паролями
async function createTestUsers() {
    const adminPass = await bcrypt.hash('admin123', 10);
    const sellerPass = await bcrypt.hash('seller123', 10);
    const userPass = await bcrypt.hash('user123', 10);

    users = [
        {
            id: 1,
            email: 'admin@military.ru',
            first_name: 'Админ',
            last_name: 'Системы',
            role: 'admin',
            isBlocked: false,
            password: adminPass
        },
        {
            id: 2,
            email: 'seller@military.ru',
            first_name: 'Иван',
            last_name: 'Петров',
            role: 'seller',
            isBlocked: false,
            password: sellerPass
        },
        {
            id: 3,
            email: 'user@example.com',
            first_name: 'Петр',
            last_name: 'Сидоров',
            role: 'user',
            isBlocked: false,
            password: userPass
        }
    ];

    console.log('Тестовые пользователи созданы:');
    console.log('admin@military.ru / admin123 (Админ)');
    console.log('seller@military.ru / seller123 (Продавец)');
    console.log('user@example.com / user123 (Пользователь)');
}
createTestUsers();

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

        // Проверяем, не заблокирован ли пользователь
        const fullUser = users.find(u => u.id === user.id);
        if (fullUser && fullUser.isBlocked) {
            return res.status(403).json({ error: 'Пользователь заблокирован' });
        }

        req.user = { ...user, role: fullUser?.role };
        next();
    });
};

// Middleware для проверки ролей
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Недостаточно прав' });
        }

        next();
    };
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
            role: 'user', // По умолчанию обычный пользователь
            isBlocked: false,
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

        if (user.isBlocked) {
            return res.status(403).json({ error: 'Пользователь заблокирован' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const accessToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: `${user.first_name} ${user.last_name}`,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        refreshTokens.push({
            token: refreshToken,
            userId: user.id,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
        });

        const { password: _, ...userWithoutPassword } = user;

        res.json({
            accessToken,
            refreshToken,
            user: userWithoutPassword
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

        const storedToken = refreshTokens.find(t => t.token === refreshToken);
        if (!storedToken) {
            return res.status(403).json({ error: 'Refresh token не найден' });
        }

        if (storedToken.expiresAt < Date.now()) {
            refreshTokens = refreshTokens.filter(t => t.token !== refreshToken);
            return res.status(403).json({ error: 'Refresh token истек' });
        }

        jwt.verify(refreshToken, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                refreshTokens = refreshTokens.filter(t => t.token !== refreshToken);
                return res.status(403).json({ error: 'Недействительный refresh token' });
            }

            const foundUser = users.find(u => u.id === user.id);
            if (!foundUser) {
                return res.status(404).json({ error: 'Пользователь не найден' });
            }

            if (foundUser.isBlocked) {
                return res.status(403).json({ error: 'Пользователь заблокирован' });
            }

            const newAccessToken = jwt.sign(
                {
                    id: foundUser.id,
                    email: foundUser.email,
                    name: `${foundUser.first_name} ${foundUser.last_name}`,
                    role: foundUser.role
                },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            const newRefreshToken = jwt.sign(
                { id: foundUser.id, email: foundUser.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            refreshTokens = refreshTokens.filter(t => t.token !== refreshToken);
            refreshTokens.push({
                token: newRefreshToken,
                userId: foundUser.id,
                expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
            });

            const { password: _, ...userWithoutPassword } = foundUser;

            res.json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                user: userWithoutPassword
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
 *     summary: Выход из системы
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

    refreshTokens = refreshTokens.filter(t => t.token !== refreshToken);
    res.json({ message: 'Успешный выход из системы' });
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список пользователей (только для админа)
 *     tags: [Пользователи]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Недостаточно прав
 */
app.get('/api/users', authenticateToken, authorize('admin'), (req, res) => {
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по id (только для админа)
 *     tags: [Пользователи]
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
 *         description: Информация о пользователе
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Пользователь не найден
 */
app.get('/api/users/:id', authenticateToken, authorize('admin'), (req, res) => {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);

    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить информацию пользователя (только для админа)
 *     tags: [Пользователи]
 *     security:
 *       - bearerAuth: []
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
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, seller, admin]
 *     responses:
 *       200:
 *         description: Пользователь обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Пользователь не найден
 */
app.put('/api/users/:id', authenticateToken, authorize('admin'), (req, res) => {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const { first_name, last_name, role } = req.body;

    users[userIndex] = {
        ...users[userIndex],
        first_name: first_name || users[userIndex].first_name,
        last_name: last_name || users[userIndex].last_name,
        role: role || users[userIndex].role
    };

    const { password, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}/block:
 *   put:
 *     summary: Заблокировать/разблокировать пользователя (только для админа)
 *     tags: [Пользователи]
 *     security:
 *       - bearerAuth: []
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
 *             required:
 *               - isBlocked
 *             properties:
 *               isBlocked:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Статус блокировки обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Пользователь не найден
 */
app.put('/api/users/:id/block', authenticateToken, authorize('admin'), (req, res) => {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const { isBlocked } = req.body;

    users[userIndex].isBlocked = isBlocked;

    const { password, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Заблокировать пользователя (только для админа)
 *     tags: [Пользователи]
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
 *         description: Пользователь заблокирован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Пользователь не найден
 */
app.delete('/api/users/:id', authenticateToken, authorize('admin'), (req, res) => {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    users[userIndex].isBlocked = true;
    res.json({ message: 'Пользователь заблокирован' });
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
 *     summary: Создать новый товар (только для продавцов и админов)
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
 *       403:
 *         description: Недостаточно прав
 */
app.post('/api/products', authenticateToken, authorize('seller', 'admin'), (req, res) => {
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
 *     summary: Обновить товар (только для продавцов и админов)
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
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Товар не найден
 */
app.put('/api/products/:id', authenticateToken, authorize('seller', 'admin'), (req, res) => {
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
 *     summary: Удалить товар (только для админов)
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
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', authenticateToken, authorize('admin'), (req, res) => {
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
    console.log('\nТестовые пользователи:');
    console.log('admin@military.ru / admin123 (Админ)');
    console.log('seller@military.ru / seller123 (Продавец)');
    console.log('user@example.com / user123 (Пользователь)');
});