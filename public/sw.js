self.addEventListener('push', function(event) {
    const data = event.data.json();
    const { title, message, icon } = data;
  
    const options = {
      body: message,
      icon,
      badge: '/icons/badge.png'
    };
  
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
});
  