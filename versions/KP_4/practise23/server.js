const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { createClient } = require('redis');
require('dotenv').config();

const app = express();

const SERVER_ID = process.env.SERVER_ID || 'unknown';
const PORT = process.env.PORT || 3001;

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('✅ Redis подключен'));

const USERS_CACHE_TTL = 60;
const PRODUCTS_CACHE_TTL = 600;

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

app.get('/', (req, res) => {
    res.json({
        server: SERVER_ID,
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

async function saveToCache(key, data, ttl) {
    try {
        await redisClient.setEx(key, ttl, JSON.stringify(data));
        console.log(`📦 Кэш сохранён: ${key} (TTL: ${ttl}с)`);
    } catch (err) {
        console.error('Cache save error:', err);
    }
}

function cacheMiddleware(keyBuilder, ttl) {
    return async (req, res, next) => {
        try {
            const key = keyBuilder(req);
            const cachedData = await redisClient.get(key);

            if (cachedData) {
                console.log(`✅ Кэш HIT: ${key}`);
                return res.json({
                    source: "cache",
                    data: JSON.parse(cachedData)
                });
            }

            console.log(`❌ Кэш MISS: ${key}`);
            req.cacheKey = key;
            req.cacheTTL = ttl;
            next();
        } catch (err) {
            console.error('Cache read error:', err);
            next();
        }
    };
}

async function invalidateUsersCache(userId = null) {
    try {
        await redisClient.del('users:all');
        if (userId) {
            await redisClient.del(`users:${userId}`);
        }
        console.log(`🗑️ Кэш пользователей инвалидирован${userId ? ` (включая users:${userId})` : ''}`);
    } catch (err) {
        console.error('Users cache invalidate error:', err);
    }
}

async function invalidateProductsCache(productId = null) {
    try {
        await redisClient.del('products:all');
        if (productId) {
            await redisClient.del(`products:${productId}`);
        }
        console.log(`🗑️ Кэш товаров инвалидирован${productId ? ` (включая products:${productId})` : ''}`);
    } catch (err) {
        console.error('Products cache invalidate error:', err);
    }
}

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ВоенТорг API',
            version: '1.0.0',
            description: 'API для магазина военного снаряжения с системой ролей',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
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
            }
        }
    },
    apis: ['./server.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

let users = [];
let refreshTokens = [];
let products = [
    {
        id: 1,
        title: "Тактический бронежилет",
        category: "Бронезащита",
        description: "Класс защиты Бр4, керамические пластины, регулируемый",
        price: 45000,
        image: "/uploads/placeholder-vest1.jpg",
        userId: 1
    },
    {
        id: 2,
        title: "Шлем тактический",
        category: "Защита головы",
        description: "Класс защиты Бр2, легкий композит, система креплений",
        price: 18000,
        image: "/uploads/placeholder-helmet.jpg",
        userId: 1
    },
    {
        id: 3,
        title: "Разгрузочная система",
        category: "Амуниция",
        description: "MOLLE система, 5 точек крепления, быстросъемная",
        price: 8500,
        image: "/uploads/placeholder-vest.jpg",
        userId: 1
    },
    {
        id: 4,
        title: "Тактические ботинки",
        category: "Экипировка",
        description: "Высокие, мембрана Gore-Tex, стальной подносок",
        price: 12000,
        image: "/uploads/placeholder-boots.jpg",
        userId: 1
    }
];
let currentId = 5;

const saveImage = (base64String) => {
    if (!base64String) return null;
    if (base64String.startsWith('/uploads/')) return base64String;

    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const mimeType = matches[1];
    const data = matches[2];
    const ext = mimeType.split('/')[1];
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, data, 'base64');
    return `/uploads/${filename}`;
};

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

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }

        const fullUser = users.find(u => u.id === user.id);
        if (fullUser && fullUser.isBlocked) {
            return res.status(403).json({ error: 'Пользователь заблокирован' });
        }

        req.user = { ...user, role: fullUser?.role };
        next();
    });
};

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
            role: 'user',
            isBlocked: false,
            password: hashedPassword
        };

        users.push(user);
        const { password: _, ...userWithoutPassword } = user;

        await invalidateUsersCache();

        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    console.log('🔐 Login request received:', req.body.email);

    try {
        const { email, password } = req.body;

        const user = users.find(u => u.email === email);
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        if (user.isBlocked) {
            console.log('❌ User blocked:', email);
            return res.status(403).json({ error: 'Пользователь заблокирован' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const accessToken = jwt.sign(
            { id: user.id, email: user.email, name: `${user.first_name} ${user.last_name}`, role: user.role },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' }
        );

        refreshTokens.push({
            token: refreshToken,
            userId: user.id,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
        });

        const { password: _, ...userWithoutPassword } = user;

        console.log('✅ Login successful for:', email);
        res.json({
            accessToken,
            refreshToken,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

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

        jwt.verify(refreshToken, process.env.JWT_SECRET || 'secret_key', (err, user) => {
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
                { id: foundUser.id, email: foundUser.email, name: `${foundUser.first_name} ${foundUser.last_name}`, role: foundUser.role },
                process.env.JWT_SECRET || 'secret_key',
                { expiresIn: '15m' }
            );

            const newRefreshToken = jwt.sign(
                { id: foundUser.id, email: foundUser.email },
                process.env.JWT_SECRET || 'secret_key',
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
        console.error('Refresh error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

app.post('/api/auth/logout', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token не предоставлен' });
    }

    refreshTokens = refreshTokens.filter(t => t.token !== refreshToken);
    res.json({ message: 'Успешный выход из системы' });
});

app.get(
    '/api/users',
    authenticateToken,
    authorize('admin'),
    cacheMiddleware(() => 'users:all', USERS_CACHE_TTL),
    async (req, res) => {
        const usersWithoutPasswords = users.map(({ password, ...user }) => user);
        await saveToCache(req.cacheKey, usersWithoutPasswords, req.cacheTTL);
        res.json({
            source: "server",
            data: usersWithoutPasswords
        });
    }
);

app.get(
    '/api/users/:id',
    authenticateToken,
    authorize('admin'),
    cacheMiddleware((req) => `users:${req.params.id}`, USERS_CACHE_TTL),
    async (req, res) => {
        const id = parseInt(req.params.id);
        const user = users.find(u => u.id === id);

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const { password, ...userWithoutPassword } = user;
        await saveToCache(req.cacheKey, userWithoutPassword, req.cacheTTL);
        res.json({
            source: "server",
            data: userWithoutPassword
        });
    }
);

app.put('/api/users/:id', authenticateToken, authorize('admin'), async (req, res) => {
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

    await invalidateUsersCache(id);

    const { password, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
});

app.put('/api/users/:id/block', authenticateToken, authorize('admin'), async (req, res) => {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const { isBlocked } = req.body;
    users[userIndex].isBlocked = isBlocked;

    await invalidateUsersCache(id);

    const { password, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
});

app.delete('/api/users/:id', authenticateToken, authorize('admin'), async (req, res) => {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    users[userIndex].isBlocked = true;

    await invalidateUsersCache(id);

    res.json({ message: 'Пользователь заблокирован' });
});

app.get(
    '/api/products',
    cacheMiddleware(() => 'products:all', PRODUCTS_CACHE_TTL),
    async (req, res) => {
        await saveToCache(req.cacheKey, products, req.cacheTTL);
        res.json({
            source: "server",
            data: products
        });
    }
);

app.get(
    '/api/products/:id',
    cacheMiddleware((req) => `products:${req.params.id}`, PRODUCTS_CACHE_TTL),
    async (req, res) => {
        const id = parseInt(req.params.id);
        const product = products.find(p => p.id === id);
        if (!product) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        await saveToCache(req.cacheKey, product, req.cacheTTL);
        res.json({
            source: "server",
            data: product
        });
    }
);

app.post('/api/products', authenticateToken, authorize('seller', 'admin'), async (req, res) => {
    try {
        const { title, category, description, price, image } = req.body;

        if (!title || !category || !description || !price) {
            return res.status(400).json({ error: 'Заполните обязательные поля' });
        }

        let imagePath = null;
        if (image) {
            imagePath = saveImage(image);
        }

        const product = {
            id: currentId++,
            title,
            category,
            description,
            price: parseFloat(price),
            image: imagePath || '/uploads/placeholder-default.jpg',
            userId: req.user.id
        };

        products.push(product);

        await invalidateProductsCache();

        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.put('/api/products/:id', authenticateToken, authorize('seller', 'admin'), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const productIndex = products.findIndex(p => p.id === id);

        if (productIndex === -1) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        const { title, category, description, price, image } = req.body;

        let imagePath = products[productIndex].image;
        if (image && image !== imagePath) {
            imagePath = saveImage(image);
        }

        products[productIndex] = {
            ...products[productIndex],
            title: title || products[productIndex].title,
            category: category || products[productIndex].category,
            description: description || products[productIndex].description,
            price: price ? parseFloat(price) : products[productIndex].price,
            image: imagePath || products[productIndex].image
        };

        await invalidateProductsCache(id);

        res.json(products[productIndex]);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/products/:id', authenticateToken, authorize('admin'), async (req, res) => {
    const id = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Товар не найден' });
    }

    products.splice(productIndex, 1);

    await invalidateProductsCache(id);

    res.status(200).json({ message: 'Товар удален' });
});

async function startServer() {
    try {
        await redisClient.connect();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n✅ Сервер ${SERVER_ID} запущен на http://localhost:${PORT}`);
            console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
            console.log(`\n⚡ Redis кэширование активно`);
        });
    } catch (err) {
        console.error('❌ Ошибка подключения к Redis:', err.message);
        console.log('⚠️ Сервер запускается без Redis');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n✅ Сервер ${SERVER_ID} запущен на http://localhost:${PORT} (без Redis)`);
        });
    }
}

startServer();