self.addEventListener('push', function(event) {
    const data = event.data.json();
    const { title, message, icon, image } = data;
  
    const options = {
      body: message,
      icon,
      data: {
        url: `https://chatapp-test-ashy.vercel.app/chat/${title}`
      }
    };

    if (image && image.trim() !== '') {
      options.image = image;
    }
  
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If site is already open, focus it
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open new tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});