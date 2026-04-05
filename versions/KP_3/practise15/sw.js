const SHELL_CACHE_NAME = 'app-shell-v1';
const PAGES_CACHE_NAME = 'pages-cache-v1';

const SHELL_ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/icons/favicon.ico',
    '/icons/favicon-16x16.png',
    '/icons/favicon-32x32.png',
    '/icons/favicon-48x48.png',
    '/icons/favicon-64x64.png',
    '/icons/favicon-128x128.png',
    '/icons/favicon-256x256.png',
    '/icons/favicon-512x512.png',
    'https://unpkg.com/chota@latest'
];

self.addEventListener('install', event => {
    console.log('[SW] Установка App Shell');
    event.waitUntil(
        caches.open(SHELL_CACHE_NAME)
            .then(cache => {
                console.log('[SW] Кэширование статических ресурсов');
                return cache.addAll(SHELL_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    console.log('[SW] Активация');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key =>
                    key !== SHELL_CACHE_NAME &&
                    key !== PAGES_CACHE_NAME
                ).map(key => {
                    console.log('[SW] Удаление старого кэша:', key);
                    return caches.delete(key);
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    if (SHELL_ASSETS.some(asset => event.request.url.includes(asset))) {
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        console.log('[SW] Cache First:', event.request.url);
                        return cachedResponse;
                    }
                    console.log('[SW] Fetch (no cache):', event.request.url);
                    return fetch(event.request);
                })
        );
        return;
    }

    if (url.pathname.startsWith('/content/')) {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    console.log('[SW] Network First (success):', event.request.url);
                    const responseToCache = networkResponse.clone();
                    caches.open(PAGES_CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    return networkResponse;
                })
                .catch(async () => {
                    console.log('[SW] Network First (offline):', event.request.url);
                    const cachedResponse = await caches.match(event.request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    if (url.pathname.includes('about')) {
                        const fallback = await caches.match('/content/home.html');
                        if (fallback) return fallback;
                    }
                    return new Response('Страница недоступна офлайн', {
                        status: 404,
                        headers: { 'Content-Type': 'text/plain' }
                    });
                })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                const fetchPromise = fetch(event.request)
                    .then(networkResponse => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(SHELL_CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    })
                    .catch(() => { });

                return cachedResponse || fetchPromise;
            })
    );
});