# 🛍️ Интернет-магазин

Учебный проект: клиент на React + сервер на Express с Swagger.

## 📁 Структура
- `practise4/` - React клиент
- `practise5/` - Express сервер

## 🚀 Быстрый старт

### Сервер
```bash
cd practise5
npm install
npm start        # http://localhost:3000

Клиент

cd practise4
npm install
npm start        # http://localhost:3001

📚 Документация API
http://localhost:3000/api-docs

🛠️ Технологии
Клиент: React, SCSS, Axios, React Router

Сервер: Express, Swagger, CORS

📍 Эндпоинты
GET /api/products - все товары

GET /api/products/:id - товар по ID

GET /api/products/category/:cat - по категории

GET /api/search?q= - поиск

POST /api/products - создать товар

PUT /api/products/:id - обновить

PATCH /api/products/:id - частично обновить

DELETE /api/products/:id - удалить


📚 Swagger
http://localhost:3000/api-docs

📁 Компоненты
Header - шапка с поиском и корзиной

Footer - подвал с контактами

ProductCard - карточка товара

ProductList - список товаров

Cart - корзина


📦 Зависимости
react, react-router-dom, axios, sass