const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// VAPID ключи
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
let timers = new Map(); // Хранилище таймеров { noteId: timer }

const appHttp = http.createServer(app);
const io = socketIo(appHttp, { cors: { origin: "*" } });

// Функция для планирования напоминания
function scheduleReminder(noteId, text, reminderTime) {
    // Очищаем старый таймер, если есть
    if (timers.has(noteId)) {
        clearTimeout(timers.get(noteId));
        timers.delete(noteId);
    }

    const delay = reminderTime - Date.now();

    if (delay > 0 && delay < 30 * 24 * 60 * 60 * 1000) { // Максимум 30 дней
        console.log(`⏰ Планирование напоминания для "${text}" через ${Math.round(delay / 1000)} секунд`);

        const timer = setTimeout(() => {
            console.log(`🔔 Сработало напоминание: "${text}"`);

            // Отправляем через WebSocket всем клиентам
            io.emit('reminderTrigger', { id: noteId, text: text });

            // Отправляем push-уведомления всем подписчикам
            const payload = JSON.stringify({
                title: '🔔 Напоминание',
                body: text,
                icon: '/icons/icon-192.png',
                tag: `reminder-${noteId}`
            });

            subscriptions.forEach(sub => {
                webpush.sendNotification(sub, payload).catch(err => {
                    console.error('Push error:', err.message);
                });
            });

            timers.delete(noteId);
        }, delay);

        timers.set(noteId, timer);
    } else if (delay > 0) {
        console.log(`⚠️ Слишком большой интервал для "${text}"`);
    } else {
        console.log(`⚠️ Время напоминания в прошлом для "${text}"`);
    }
}

io.on('connection', (socket) => {
    console.log('✅ Клиент подключен:', socket.id);

    socket.on('newTask', (task) => {
        console.log('📝 Новая задача с напоминанием:', task.text);

        // Рассылаем через WebSocket
        io.emit('taskAdded', task);

        if (task.reminder) {
            scheduleReminder(task.id, task.text, task.reminder);
        }
    });

    socket.on('deleteTask', ({ id }) => {
        if (timers.has(id)) {
            clearTimeout(timers.get(id));
            timers.delete(id);
            console.log(`Таймер удален для заметки ${id}`);
        }
    });

    socket.on('snoozeReminder', ({ id, newReminder }) => {
        console.log(`Откладывание напоминания для заметки ${id}`);

        socket.emit('reminderUpdated', { id, newReminder });

        if (timers.has(id)) {
            clearTimeout(timers.get(id));
            timers.delete(id);
        }

    });

    socket.on('disconnect', () => {
        console.log('🔴 Клиент отключен:', socket.id);
    });
});

app.post('/subscribe', (req, res) => {
    subscriptions.push(req.body);
    console.log('✅ Подписка, всего:', subscriptions.length);
    res.json({ ok: true });
});

app.post('/unsubscribe', (req, res) => {
    subscriptions = subscriptions.filter(s => s.endpoint !== req.body.endpoint);
    console.log('❌ Отписка, осталось:', subscriptions.length);
    res.json({ ok: true });
});

const PORT = 3001;
appHttp.listen(PORT, () => {
    console.log(`
    СЕРВЕР ЗАПУЩЕН
    http://localhost:${PORT}
    `);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Остановка сервера, очистка таймеров...');
    for (const timer of timers.values()) {
        clearTimeout(timer);
    }
    process.exit();
});