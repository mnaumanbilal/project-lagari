self.addEventListener("push", (event) => {
  let data = { title: "Lagari", body: "Order update", url: "/" };
  try {
    data = { ...data, ...JSON.parse(event.data?.text() ?? "{}") };
  } catch {
    /* use defaults */
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url ?? "/" },
      tag: "lagari-order",
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
