/**
 * BeGift Service Worker
 *
 * Scopo primario: ricevere Web Push dal push service (FCM/Mozilla/Apple)
 * anche con l'app chiusa o in background, e mostrare la notifica OS
 * nativa. Questo è ciò che rende le notifiche "tipo WhatsApp" su
 * iPhone PWA e Android installato.
 *
 * Comportamento:
 *  - Al evento `push` ricevuto dal browser, parse il payload JSON
 *    (inviato dal nostro endpoint /api/push/send via web-push lib)
 *    e mostra una self.registration.showNotification(...)
 *  - Al evento `notificationclick`, porta l'utente al link contenuto
 *    nel payload (es. /gift/{id} per un gift_received)
 *  - Minimal caching: NON facciamo offline cache dell'app (scope
 *    Onda 2, out of scope per ora). Se servirà, si aggiunge qui.
 *
 * Vincoli iOS Safari PWA (>= 16.4):
 *  - Web Push funziona SOLO se la PWA è installata da Home ("Add to
 *    Home Screen"). In browser normale Apple blocca le push.
 *  - Il SW DEVE essere servito dalla root (`/sw.js`) con mime JS
 *    corretto. Next.js serve tutto in /public come atteso.
 *  - Su iOS le notifiche silenziose (senza title/body) vengono
 *    scartate dal sistema — noi inviamo sempre entrambi.
 */

self.addEventListener("push", function (event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    // Fallback: se il payload non è JSON, lo trattiamo come stringa semplice
    payload = { title: "BeGift", body: event.data.text() };
  }

  const title = payload.title || "BeGift";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    // Tag = dedupe: se arriva un altra push con lo stesso tag mentre
    // la prima è ancora visibile, sostituisce invece di sovrapporre
    tag: payload.tag || "begift",
    // Vibration pattern minimo e discreto (Android)
    vibrate: [200, 100, 200],
    // Data custom: usata dal notificationclick handler per navigare
    data: {
      url: payload.url || "/",
      giftId: payload.giftId || null,
    },
    // `requireInteraction`: false = si auto-dismiss dopo qualche
    // secondo (comportamento standard, non invadente)
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  // Se l'utente ha già una tab BeGift aperta, la focussa invece di
  // aprirne una nuova — evita duplicati fastidiosi
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        // Se troviamo una window BeGift aperta, naviga e focus
        if (client.url.includes(self.location.origin) && "focus" in client) {
          if ("navigate" in client) {
            return client.navigate(url).then(() => client.focus());
          }
          return client.focus();
        }
      }
      // Altrimenti apri nuova finestra/tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// install/activate handlers: il minimo indispensabile per attivarsi
// immediatamente senza aspettare che tutte le vecchie tab siano chiuse.
self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});
