// Элементы DOM
const form = document.getElementById('note-form');
const input = document.getElementById('note-input');
const list = document.getElementById('notes-list');

// Загрузка заметок из localStorage при старте
function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    if (notes.length === 0) {
        list.innerHTML = '<li style="text-align: center; color: #999;">Нет заметок. Добавьте первую!</li>';
    } else {
        list.innerHTML = notes.map((note, index) => `<li>${escapeHtml(note)} <button onclick="deleteNote(${index})" style="float: right; background: #dc3545; padding: 4px 8px;">✖</button></li>`).join('');
    }
}

// Функция для защиты от XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Сохранение заметки
function addNote(text) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.push(text);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
}

// Удаление заметки
window.deleteNote = function(index) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.splice(index, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
};

// Обработка отправки формы
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
        addNote(text);
        input.value = '';
    }
});

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ ServiceWorker зарегистрирован:', registration.scope);
            
            // Проверка обновлений
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('🔄 Найдена новая версия Service Worker');
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('🆕 Доступна новая версия, обновите страницу');
                    }
                });
            });
        } catch (err) {
            console.error('❌ Ошибка регистрации ServiceWorker:', err);
        }
    });
}

// Отслеживание установки PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('📱 Приложение можно установить');
    
    // Можно добавить кнопку установки
    const installBtn = document.createElement('button');
    installBtn.textContent = '📲 Установить приложение';
    installBtn.style.position = 'fixed';
    installBtn.style.bottom = '20px';
    installBtn.style.right = '20px';
    installBtn.style.zIndex = '1000';
    installBtn.onclick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Результат установки: ${outcome}`);
            deferredPrompt = null;
            installBtn.remove();
        }
    };
    document.body.appendChild(installBtn);
});

// Первоначальная загрузка
loadNotes();