let socket;
let isPushEnabled = false;

const VAPID_PUBLIC_KEY = 'BKacA1AGB-aQfNSW5mixflIRCkzAMGgMlwIusDIJjHD0U6Yd6N4n3H77CjwWJpz0WtMrcBtubTTMgqV3P4_A8Ys';

// Конвертация ключа
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Заметки
function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const list = document.getElementById('notes-list');
    if (!list) return;

    if (notes.length === 0) {
        list.innerHTML = '<li style="text-align: center; color: #999;">📭 Нет заметок</li>';
    } else {
        list.innerHTML = notes.map((note, index) => {
            const text = typeof note === 'string' ? note : note.text;
            return `<li style="background: #f5f5f5; margin: 10px 0; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span>📝 ${escapeHtml(text)}</span>
                <button onclick="deleteNote(${index})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">✖</button>
            </li>`;
        }).join('');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addNote() {
    const input = document.getElementById('note-input');
    const text = input.value.trim();
    if (!text) return;

    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.push({ id: Date.now(), text: text });
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
    input.value = '';

    if (socket && socket.connected) {
        socket.emit('newTask', { text: text });
        showToast('✅ Отправлено', 1000);
    }
}

window.deleteNote = function (index) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.splice(index, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
    showToast('🗑 Удалено', 1000);
};

function showToast(msg, duration = 2000) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background: #4285f4; color: white; padding: 10px 20px;
        border-radius: 8px; z-index: 10000; font-size: 14px;
        animation: fadeOut ${duration}ms forwards;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

// Socket.IO
function initSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('✅ WebSocket подключен');
    });

    socket.on('taskAdded', (data) => {
        console.log('📥 Получена заметка:', data.text);
        showToast(`📝 ${data.text}`, 2000);
        loadNotes();
    });

    socket.on('disconnect', () => {
        console.log('❌ WebSocket отключен');
    });
}

// Push уведомления
async function togglePush() {
    const btn = document.getElementById('pushBtn');

    if (isPushEnabled) {
        // Отписка
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
            await fetch('/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: sub.endpoint })
            });
            await sub.unsubscribe();
        }
        isPushEnabled = false;
        btn.textContent = '🔕 Включить уведомления';
        btn.style.background = '#4285f4';
        showToast('🔕 Уведомления выключены');
    } else {
        // Подписка
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            alert('Нужно разрешение на уведомления');
            return;
        }

        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();

        if (!sub) {
            sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        const res = await fetch('/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub)
        });

        if (res.ok) {
            isPushEnabled = true;
            btn.textContent = '🔔 Уведомления включены';
            btn.style.background = '#28a745';
            showToast('🔔 Уведомления включены');
            console.log('✅ Push подписка создана');
        }
    }
}

// Создание интерфейса
async function initUI() {
    document.body.innerHTML = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1>📝 Мои заметки</h1>
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <input id="note-input" type="text" placeholder="Введите заметку..." style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                <button onclick="addNote()" style="background: #4285f4; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">➕ Добавить</button>
            </div>
            <button id="pushBtn" onclick="togglePush()" style="width: 100%; padding: 10px; background: #4285f4; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px;">
                🔕 Включить уведомления
            </button>
            <ul id="notes-list" style="list-style: none; padding: 0;"></ul>
        </div>
        <style>
            @keyframes fadeOut {
                0% { opacity: 1; }
                70% { opacity: 1; }
                100% { opacity: 0; visibility: hidden; }
            }
        </style>
    `;

    loadNotes();
}

// Инициализация
async function init() {
    await initUI();

    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ ServiceWorker зарегистрирован');

            initSocket();

            // Восстанавливаем состояние кнопки
            const sub = await registration.pushManager.getSubscription();
            if (sub) {
                isPushEnabled = true;
                const btn = document.getElementById('pushBtn');
                if (btn) {
                    btn.textContent = '🔔 Уведомления включены';
                    btn.style.background = '#28a745';
                }
            }
        } catch (err) {
            console.error('❌ Ошибка:', err);
        }
    }
}

// Запуск
init();