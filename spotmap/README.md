# spot — web prototype

> **Note:** This is the early web prototype. The class submission is the React Native app in `../spotmap-rn/`.

A mobile-first social map app for sharing your favorite places with friends. Drop pins on a map, browse by category, and see what spots your friends recommend.

Built for CS278 @ Stanford.

---

## Features

- Google Sign-In (or skip login for local demo)
- Drop pins with a name, category, note, and optional photo
- Browse pins by category: Study, Food, Coffee, Events, Hidden Gem, Fun
- Tap any pin for a full detail view
- Light / dark theme toggle

---

## Tech Stack

- React 19
- Firebase (Auth, Firestore, Storage)
- Leaflet + OpenStreetMap (no API key needed)
- Hosted via Firebase Hosting

---

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd spotmap
npm install
```

### 2. Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project
2. Enable the following services:
   - **Authentication** → Sign-in method → enable Google
   - **Firestore Database** → Create database → start in test mode
   - **Storage** → Get started → start in test mode
3. Go to Project Settings → Your apps → add a **Web app**
4. Copy the config object and paste it into `src/firebase.js`:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### 3. Run the app

```bash
npm start
```

Opens at [http://localhost:3000](http://localhost:3000). For the best experience, open Chrome DevTools and toggle the device toolbar (Cmd+Shift+M) to preview as a phone.

> **No Firebase yet?** Click **"Skip for now (demo only)"** on the login screen to explore the app without any setup.

---

## Firestore Security Rules

Before sharing the app with real users, update your rules in Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pins/{pin} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.authorId;
    }
  }
}
```

---

## Deploy

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # set build/ as public dir, yes to SPA rewrite
npm run build
firebase deploy
```

You'll get a live URL like `spotmap-abc12.web.app` to share with others.
