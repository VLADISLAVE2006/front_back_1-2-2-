const CACHE_NAME = 'notes-v1';

self.addEventListener('install', event => {
    console.log('[SW] Установка');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
    console.log('[SW] Активация');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request));
});

self.addEventListener('push', (event) => {
    console.log('[SW] Push получено');

    let data = {
        title: '🔔 Напоминание',
        body: 'У вас запланированная заметка',
        icon: '/icons/icon-192.png',
        tag: 'reminder',
        actions: [
            {
                action: 'snooze',
                title: 'Отложить на 5 минут'
            },
            {
                action: 'complete',
                title: '✅ Выполнено'
            }
        ]
    };

    if (event.data) {
        try {
            const payload = event.data.json();
            data.title = payload.title || data.title;
            data.body = payload.body || data.body;
            data.tag = payload.tag || data.tag;
        } catch (e) {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            badge: '/icons/favicon-64x64.png',
            vibrate: [200, 100, 200],
            tag: data.tag,
            actions: data.actions,
            requireInteraction: true,
            data: {
                url: '/',
                noteText: data.body,
                action: 'reminder'
            }
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Клик по уведомлению, action:', event.action);

    event.notification.close();

    if (event.action === 'snooze') {
        console.log('Откладывание напоминания на 5 минут');

        event.waitUntil(
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'SNOOZE_REMINDER',
                        noteText: event.notification.data?.noteText || ''
                    });
                });
            })
        );
и
        self.registration.showNotification('Напоминание отложено', {
            body: 'Вы получите его через 5 минут',
            icon: '/icons/icon-192.png',
            requireInteraction: false
        });

    } else if (event.action === 'complete') {
        console.log('✅ Заметка выполнена');

        event.waitUntil(
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'COMPLETE_TASK',
                        noteText: event.notification.data?.noteText || ''
                    });
                });
            })
        );

    } else {
        event.waitUntil(
            self.clients.openWindow('/')
        );
    }
});

self.addEventListener('message', (event) => {
    console.log('[SW] Получено сообщение:', event.data);

    if (event.data.type === 'UPDATE_REMINDER') {
        console.log('Обновление напоминания:', event.data.noteId);
    }
});