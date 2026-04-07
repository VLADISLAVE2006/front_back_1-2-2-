let socket;
let isPushEnabled = false;

const VAPID_PUBLIC_KEY = 'BKacA1AGB-aQfNSW5mixflIRCkzAMGgMlwIusDIJjHD0U6Yd6N4n3H77CjwWJpz0WtMrcBtubTTMgqV3P4_A8Ys';

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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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

function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const list = document.getElementById('notes-list');
    const showRemindersOnly = document.getElementById('show-reminders-only')?.checked || false;

    if (!list) return;

    let filteredNotes = notes;
    if (showRemindersOnly) {
        filteredNotes = notes.filter(note => note.reminder);
    }

    if (filteredNotes.length === 0) {
        list.innerHTML = '<li style="text-align: center; color: #999;">📭 Нет заметок</li>';
    } else {
        list.innerHTML = filteredNotes.map((note, idx) => {
            const originalIndex = notes.findIndex(n => n.id === note.id);
            const reminderText = note.reminder ? `🔔 ${new Date(note.reminder).toLocaleString()}` : '';
            const isOverdue = note.reminder && new Date(note.reminder) < new Date();

            return `<li style="background: ${isOverdue ? '#ffebee' : '#f5f5f5'}; margin: 10px 0; padding: 12px; border-radius: 8px;">
                <div><strong> ${escapeHtml(note.text)}</strong></div>
                ${reminderText ? `<div style="font-size: 12px; color: ${isOverdue ? 'red' : '#666'};">${reminderText}</div>` : ''}
                <div style="margin-top: 10px; display: flex; gap: 5px;">
                    <button onclick="deleteNote(${originalIndex})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">✖ Удалить</button>
                    ${note.reminder ? `<button onclick="snoozeReminder(${originalIndex})" style="background: #ff9800; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">⏰ Отложить на 5 мин</button>` : ''}
                </div>
            </li>`;
        }).join('');
    }
}

function addNote() {
    const input = document.getElementById('note-input');
    const dateInput = document.getElementById('reminder-date');
    const timeInput = document.getElementById('reminder-time');
    const text = input.value.trim();

    if (!text) return;

    let reminder = null;
    if (dateInput.value && timeInput.value) {
        reminder = new Date(`${dateInput.value}T${timeInput.value}`).getTime();
        if (reminder < Date.now()) {
            showToast('Нельзя установить напоминание в прошлом');
            return;
        }
    }

    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const newNote = {
        id: Date.now(),
        text: text,
        reminder: reminder,
        createdAt: Date.now()
    };

    notes.push(newNote);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();

    input.value = '';
    dateInput.value = '';
    timeInput.value = '';

    if (socket && socket.connected && reminder) {
        socket.emit('newTask', {
            id: newNote.id,
            text: text,
            reminder: reminder
        });
        showToast('✅ Заметка с напоминанием отправлена', 2000);
    } else if (reminder) {
        showToast('⚠️ Напоминание не запланировано (нет соединения)', 3000);
    }
}

window.deleteNote = function (index) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.splice(index, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
    showToast('Заметка удалена', 1000);

    if (socket && socket.connected) {
        socket.emit('deleteTask', { index });
    }
};

window.snoozeReminder = function (index) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const note = notes[index];

    if (note && note.reminder) {
        const newReminder = Date.now() + 5 * 60 * 1000;
        note.reminder = newReminder;
        localStorage.setItem('notes', JSON.stringify(notes));
        loadNotes();

        if (socket && socket.connected) {
            socket.emit('snoozeReminder', { id: note.id, newReminder: newReminder });
        }
        showToast('Напоминание отложено на 5 минут');
    }
};

function initSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('✅ WebSocket подключен');
    });

    socket.on('taskAdded', (data) => {
        console.log(' Получена заметка:', data.text);
        showToast(` ${data.text}`, 2000);
        loadNotes();
    });

    socket.on('reminderTrigger', (data) => {
        console.log('🔔 Получено напоминание:', data);
        showToast(`🔔 НАПОМИНАНИЕ: ${data.text}`, 5000);
        loadNotes();

        if (Notification.permission === 'granted') {
            new Notification('🔔 Напоминание', {
                body: data.text,
                icon: '/icons/icon-192.png'
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ WebSocket отключен');
    });
}

async function togglePush() {
    const btn = document.getElementById('pushBtn');

    if (isPushEnabled) {
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
        }
    }
}

async function initUI() {
    document.body.innerHTML = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1>Мои заметки с напоминаниями</h1>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <input id="note-input" type="text" placeholder="Введите заметку..." style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <input id="reminder-date" type="date" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                <input id="reminder-time" type="time" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>
            <button onclick="addNote()" style="width: 100%; padding: 10px; background: #4285f4; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 10px;">
                Добавить заметку
            </button>
            <button id="pushBtn" onclick="togglePush()" style="width: 100%; padding: 10px; background: #4285f4; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 10px;">
                🔕 Включить уведомления
            </button>
            <div style="margin: 10px 0;">
                <label>
                    <input type="checkbox" id="show-reminders-only" onchange="loadNotes()"> 🔔 Показать только заметки с напоминаниями
                </label>
            </div>
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

async function init() {
    await initUI();

    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ ServiceWorker зарегистрирован');

            initSocket();

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

init();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Сообщение от SW:', event.data);

        if (event.data.type === 'SNOOZE_REMINDER') {
            const notes = JSON.parse(localStorage.getItem('notes') || '[]');
            const note = notes.find(n => n.text === event.data.noteText);
            if (note) {
                const index = notes.findIndex(n => n.id === note.id);
                snoozeReminder(index);
            }
        } else if (event.data.type === 'COMPLETE_TASK') {
            const notes = JSON.parse(localStorage.getItem('notes') || '[]');
            const index = notes.findIndex(n => n.text === event.data.noteText);
            if (index !== -1) {
                deleteNote(index);
            }
        }
    });
}