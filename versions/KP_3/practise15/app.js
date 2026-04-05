let form, input, list;

function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    if (notes.length === 0) {
        list.innerHTML = '<li style="text-align: center; color: #999;">Нет заметок. Добавьте первую!</li>';
    } else {
        list.innerHTML = notes.map((note, index) => `<li>${escapeHtml(note)} <button onclick="deleteNote(${index})" style="float: right; background: #dc3545; padding: 4px 8px;">✖</button></li>`).join('');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addNote(text) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.push(text);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
}

window.deleteNote = function (index) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.splice(index, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
};

function initNotes() {
    form = document.getElementById('note-form');
    input = document.getElementById('note-input');
    list = document.getElementById('notes-list');

    if (form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        form = newForm;
        input = document.getElementById('note-input');
        list = document.getElementById('notes-list');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (text) {
                addNote(text);
                input.value = '';
            }
        });
    }

    loadNotes();
}

async function loadContent(page) {
    const contentDiv = document.getElementById('app-content');

    contentDiv.innerHTML = '<div class="loading">⏳ Загрузка...</div>';

    try {
        const response = await fetch(`/content/${page}.html`);

        if (!response.ok) throw new Error('Страница не найдена');

        const html = await response.text();
        contentDiv.innerHTML = html;

        if (page === 'home') {
            initNotes();
        }

        const cache = await caches.open('pages-cache-v1');
        cache.put(`/content/${page}.html`, new Response(html, {
            headers: { 'Content-Type': 'text/html' }
        }));

    } catch (error) {
        console.log('Ошибка загрузки из сети:', error);

        try {
            const cache = await caches.open('pages-cache-v1');
            const cachedResponse = await cache.match(`/content/${page}.html`);

            if (cachedResponse) {
                const html = await cachedResponse.text();
                contentDiv.innerHTML = html;

                if (page === 'home') {
                    initNotes();
                }

                showOfflineNotification();
            } else {
                if (page === 'home') {
                    contentDiv.innerHTML = `
                        <div style="text-align: center; padding: 40px;">
                            <h2>😕 Не удалось загрузить заметки</h2>
                            <p>Проверьте подключение к интернету</p>
                            <button onclick="loadContent('home')" style="background: #4285f4; padding: 10px 20px; border: none; border-radius: 5px; color: white; cursor: pointer;">
                                🔄 Повторить
                            </button>
                        </div>
                    `;
                } else {
                    contentDiv.innerHTML = `
                        <div style="text-align: center; padding: 40px;">
                            <h2>😕 Страница недоступна офлайн</h2>
                            <p>Подключитесь к интернету для загрузки этой страницы</p>
                            <button onclick="loadContent('home')" style="background: #4285f4; padding: 10px 20px; border: none; border-radius: 5px; color: white; cursor: pointer;">
                                ← На главную
                            </button>
                        </div>
                    `;
                }
            }
        } catch (cacheError) {
            console.error('Ошибка загрузки из кэша:', cacheError);
            contentDiv.innerHTML = '<div class="loading">❌ Ошибка загрузки контента</div>';
        }
    }
}

function showOfflineNotification() {
    const notification = document.createElement('div');
    notification.textContent = '📡 Работа в офлайн режиме';
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #ff9800;
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        z-index: 1000;
        animation: fadeOut 3s ease-in-out forwards;
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut {
            0% { opacity: 1; }
            70% { opacity: 1; }
            100% { opacity: 0; visibility: hidden; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

document.getElementById('nav-home').addEventListener('click', () => {
    loadContent('home');
    document.getElementById('nav-home').classList.add('active');
    document.getElementById('nav-about').classList.remove('active');
});

document.getElementById('nav-about').addEventListener('click', () => {
    loadContent('about');
    document.getElementById('nav-about').classList.add('active');
    document.getElementById('nav-home').classList.remove('active');
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ ServiceWorker зарегистрирован:', registration.scope);
        } catch (err) {
            console.error('❌ Ошибка регистрации ServiceWorker:', err);
        }
    });
}

loadContent('home');