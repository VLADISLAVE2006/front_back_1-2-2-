const https = require('https');
const fs = require('fs');
const express = require('express');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// ВАШИ VAPID КЛЮЧИ
const vapidKeys = {
    publicKey: 'BKacA1AGB-aQfNSW5mixflIRCkzAMGgMlwIusDIJjHD0U6Yd6N4n3H77CjwWJpz0WtMrcBtubTTMgqV3P4_A8Ys',
    privateKey: 'SEvPNVeDCpMoFz-Tlczpl6Cxrix9iPaGSSYVccP0jxw'
};

webpush.setVapidDetails(
    'mailto:vlados4580153@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..')));

let subscriptions = [];

// Загрузка сертификатов от mkcert
const options = {
    key: fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};

console.log('✅ Сертификаты загружены');

const server = https.createServer(options, app);
const io = socketIo(server, {
    cors: { origin: "*" },
    transports: ['websocket', 'polling']
});

io.on('connection', (socket) => {
    console.log('🟢 Клиент подключён:', socket.id);

    socket.on('newTask', (task) => {
        console.log('📝 Новая задача:', task.text);

        // WebSocket рассылка всем
        io.emit('taskAdded', task);

        // Push-уведомления
        const payload = JSON.stringify({
            title: '📝 Новая заметка!',
            body: task.text,
            icon: '/icons/icon-192.png',
            badge: '/icons/favicon-64x64.png'
        });

        subscriptions.forEach((sub, i) => {
            webpush.sendNotification(sub, payload)
                .then(() => console.log(`✅ Push отправлен ${i + 1}`))
                .catch(err => console.error(`❌ Ошибка push:`, err.message));
        });
    });

    socket.on('disconnect', () => {
        console.log('🔴 Клиент отключён:', socket.id);
    });
});

app.post('/subscribe', (req, res) => {
    const sub = req.body;
    if (!subscriptions.find(s => s.endpoint === sub.endpoint)) {
        subscriptions.push(sub);
    }
    console.log('✅ Подписка добавлена. Всего:', subscriptions.length);
    res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
    console.log('❌ Подписка удалена. Осталось:', subscriptions.length);
    res.status(200).json({ message: 'Подписка удалена' });
});

const PORT = 3443;
server.listen(PORT, () => {
    console.log(`
    ═══════════════════════════════════════════
    🔒 HTTPS СЕРВЕР ЗАПУЩЕН (mkcert)
    ═══════════════════════════════════════════
    📡 https://localhost:${PORT}
    🔌 WebSocket: Socket.IO активен
    🔔 Push-уведомления: ГОТОВЫ
    ═══════════════════════════════════════════
    `);
});