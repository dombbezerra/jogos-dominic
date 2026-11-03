// Recebe os avisos de "jogo novo" e mostra a notificação no celular.
// O aviso chega sem texto; a mensagem é buscada no servidor na hora.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  e.waitUntil((async () => {
    let msg = { titulo: 'Jogos do Dominic', texto: 'Tem novidade nos jogos! 🎮', url: '/' };
    try {
      const r = await fetch('/api/push/?ultima=1', { cache: 'no-store' });
      if (r.ok) msg = await r.json();
    } catch (err) { /* sem internet: mostra o aviso padrão */ }
    await self.registration.showNotification(msg.titulo, {
      body: msg.texto,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: msg.url || '/' },
    });
  })());
});

// Tocou na notificação: abre os jogos
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) if ('focus' in w) { w.navigate(url); return w.focus(); }
    return self.clients.openWindow(url);
  })());
});
