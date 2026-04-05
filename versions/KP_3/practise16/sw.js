const CACHE_NAME = 'notes-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json'
];

// Установка
self.addEventListener('install', event => {
    console.log('[SW] Установка');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Активация
self.addEventListener('activate', event => {
    console.log('[SW] Активация');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - КЭШИРУЕМ ТОЛЬКО GET-ЗАПРОСЫ
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Кэшируем только GET запросы и только статические файлы
    if (event.request.method === 'GET' && STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith('.js') || url.pathname.endsWith('.html'))) {
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(event.request)
                        .then(networkResponse => {
                            if (networkResponse && networkResponse.status === 200) {
                                const responseToCache = networkResponse.clone();
                                caches.open(CACHE_NAME)
                                    .then(cache => {
                                        cache.put(event.request, responseToCache);
                                    });
                            }
                            return networkResponse;
                        });
                })
        );
    } else {
        // Для POST, PUT, DELETE и других - просто идем в сеть
        event.respondWith(fetch(event.request));
    }
});

// Push уведомления
self.addEventListener('push', (event) => {
    console.log('[SW] 🔔 Push получено!');

    let title = '📝 Новая заметка';
    let body = 'Кто-то добавил заметку';
    let icon = '/icons/icon-192.png';

    if (event.data) {
        try {
            const data = event.data.json();
            title = data.title || title;
            body = data.body || body;
            icon = data.icon || icon;
            console.log('[SW] Данные:', { title, body });
        } catch (e) {
            body = event.data.text();
        }
    }

    const options = {
        body: body,
        icon: icon,
        badge: '/icons/favicon-64x64.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: {
            url: '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Клик по уведомлению
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Клик по уведомлению');
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});