# spot — CS278 @ Stanford

A social map app for sharing your favorite places with friends. Drop pins, browse by category, and see where your friends recommend.

This repo has two folders:

| Folder | What it is |
|---|---|
| `spotmap-rn/` | **React Native app (Expo)** — the main app, runs on iOS and Android via Expo Go. Submit this for class. |
| `spotmap/` | React web app — used for early prototyping. Not the class submission. |

---

## Quick start (mobile app)

```bash
cd spotmap-rn
npx expo start
```

Scan the QR code with **Expo Go** on your phone (iOS or Android).

> No Firebase yet? Tap **"Skip for now (demo only)"** on the login screen.

---

## Folder structure — `spotmap-rn/`

```
spotmap-rn/
├── App.js              # Root: navigation stack, auth state, theme toggle
├── firebase.js         # Firebase init (fill in your config here)
├── constants.js        # Categories, theme colors, Stanford coords, preset locations
├── app.json            # Expo config (name, bundle ID, EAS project ID)
├── screens/
│   ├── Login.js        # Google sign-in + guest skip button
│   ├── MapView.js      # Map with pins, category filter, slide-up preview sheet
│   ├── AddPin.js       # Form to drop a new pin (name, category, note, photo, location)
│   └── PinDetail.js    # Full detail view for a single pin
└── assets/             # App icon, splash screen images
```

---

## Firebase setup (do this once)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → create a project
2. Enable these three services:
   - **Authentication** → Sign-in method → Google
   - **Firestore Database** → Create database → test mode
   - **Storage** → Get started → test mode
3. Project Settings → Your apps → add a **Web app** → copy the config
4. Paste the config into `spotmap-rn/firebase.js`:

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

> Both `spotmap-rn/` and `spotmap/` use the same Firebase project. You only need to set this up once and paste the same config into both `firebase.js` files.

---

## Class submission (EAS / Expo Go)

Follow the steps from the class guide:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas update:configure
eas update --auto
```

Then share the link from the EAS dashboard. Teammates scan it with Expo Go.

---

## Firestore security rules

Paste these in Firebase Console → Firestore → Rules before sharing with test participants:

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

## Theme

The app defaults to **light mode**. Tap the 🌙 button in the top-right of the map to switch to dark mode.
