importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
const firebaseConfig = {
  projectId: "gen-lang-client-0022373400",
  appId: "1:1012862506590:web:ce6e37c15b8a1afd20c6cf",
  apiKey: "AIzaSyBHELYrPmJAYKfM8fOtNzTT67AB-XysTY0",
  authDomain: "gen-lang-client-0022373400.firebaseapp.com",
  messagingSenderId: "1012862506590"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification?.title || 'Notifikasi Baru';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icon-192x192.png' // Pastikan Anda memiliki icon ini di folder public
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
