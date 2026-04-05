const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// ВАШИ НОВЫЕ КЛЮЧИ
const vapidKeys = {
    publicKey: 'BKacA1AGB-aQfNSW5mixflIRCkzAMGgMlwIusDIJjHD0U6Yd6N4n3H77CjwWJpz0WtMrcBtubTTMgqV3P4_A8Ys',
    privateKey: 'SEvPNVeDCpMoFz-Tlczpl6Cxrix9iPaGSSYVccP0jxw'
};

console.log('🔑 VAPID ключи загружены');
console.log('Public key:', vapidKeys.publicKey.substring(0, 30) + '...');
console.log('Private key:', vapidKeys.privateKey.substring(0, 30) + '...');

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

const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    console.log('🟢 Клиент подключён:', socket.id);

    socket.on('newTask', (task) => {
        console.log('📝 Новая задача:', task);
        // Рассылаем всем через WebSocket
        io.emit('taskAdded', task);

        // Отправляем push-уведомления всем подписчикам
        const payload = JSON.stringify({
            title: '📝 Новая заметка!',
            body: task.text,
            icon: '/icons/icon-192.png',
            badge: '/icons/favicon-64x64.png'
        });

        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => {
                console.error('Push error:', err.message);
                if (err.statusCode === 410) {
                    subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
                }
            });
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

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`
    ═══════════════════════════════════════════
    🚀 СЕРВЕР ЗАПУЩЕН
    ═══════════════════════════════════════════
    📡 http://localhost:${PORT}
    🔌 WebSocket: Socket.IO активен
    🔔 Push-уведомления: ГОТОВЫ
    ═══════════════════════════════════════════
    `);
});