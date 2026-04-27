# spot — setup guide

A mobile-first web app for dropping friend-curated pins on a map.

## What you need (all free)
1. Firebase account → https://console.firebase.google.com
2. Google Maps API key → https://console.cloud.google.com
3. Node.js installed on your machine

---

## Step 1 — Firebase setup

1. Go to https://console.firebase.google.com → "Add project" → name it "spotmap"
2. In the project, enable these three services:
   - **Authentication** → Sign-in method → enable Google
   - **Firestore Database** → Create database → start in test mode
   - **Storage** → Get started → start in test mode
3. Go to Project Settings (gear icon) → "Your apps" → add a Web app
4. Copy the firebaseConfig object it gives you

## Step 2 — Add your Firebase config

Open `src/firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",           // ← paste from Firebase
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 3 — Google Maps API key

1. Go to https://console.cloud.google.com
2. Create a project → APIs & Services → Enable:
   - Maps JavaScript API
3. Create credentials → API Key → copy it
4. Open `src/constants.js` and replace:

```js
export const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
```

## Step 4 — Run locally

```bash
npm install
npm start
```

Opens at http://localhost:3000 — use Chrome DevTools mobile view to see it as a phone.

## Step 5 — Deploy (free, takes 2 min)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting    # select your project, set build/ as public dir, yes to SPA
npm run build
firebase deploy
```

You'll get a live URL like `spotmap-abc12.web.app` to share with your test participants.

---

## Adding test locations

Edit the `NEARBY_PLACES` array in `src/pages/AddPin.js` to add more Stanford/Bay Area locations your test participants will recognize.

## Firestore rules (before sharing with real users)

In Firebase Console → Firestore → Rules, paste:

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

## Storage rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /pins/{file} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```
