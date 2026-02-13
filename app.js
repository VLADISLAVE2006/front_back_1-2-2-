const express = require('express');
const app = express();
const port = 3000;

let products = [
    {id: 1, name: 'Ноутбук', price: 50000},
    {id: 2, name: 'Смартфон', price: 30000},
    {id: 3, name: 'Наушники', price: 5000}
];

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Добро пожаловать в магазин! Используйте /products');
});

app.post('/products', (req, res) => {
    const { name, price } = req.body;
    
    if (!name || !price) {
        return res.status(400).json({ 
            error: 'Необходимо указать название и стоимость товара' 
        });
    }
    
    const newProduct = {
        id: Date.now(), 
        name,
        price: Number(price)
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.get('/products', (req, res) => {
    res.json(products);
});

app.get('/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    
    if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    res.json(product);
});

app.patch('/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    
    if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    const { name, price } = req.body;
    
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = Number(price);
    
    res.json(product);
});

app.delete('/products/:id', (req, res) => {
    const initialLength = products.length;
    products = products.filter(p => p.id != req.params.id);
    
    if (products.length === initialLength) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    res.json({ message: 'Товар удален' });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log('Доступные маршруты:');
    console.log('  GET    /products          - все товары');
    console.log('  GET    /products/:id      - товар по ID');
    console.log('  POST   /products          - создать товар');
    console.log('  PATCH  /products/:id      - обновить товар');
    console.log('  DELETE /products/:id      - удалить товар');
});