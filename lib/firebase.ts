/**
 * Firebase client entry point.
 *
 * NOTE FOR THE TEAM: Firebase setup / auth / data seeding is owned by another
 * teammate. This file only needs to export an initialised Firestore instance as
 * `db`. If you already have your own init, keep that one — just make sure it
 * still exports `db` (and reads the same EXPO_PUBLIC_FIREBASE_* env vars) so the
 * dashboard keeps working.
 *
 * The config is supplied through `.env.local` (see `.env.example`). These
 * EXPO_PUBLIC_* values are inlined into the client bundle and are safe to ship —
 * access is controlled by Firestore security rules, not by hiding the keys.
 */
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** True once the Firebase web config has actually been provided via env. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);

let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let firebaseAuth: Auth | null = null;

if (isFirebaseConfigured) {
  if (getApps().length) {
    app = getApp();
    firestore = getFirestore(app);
  } else {
    app = initializeApp(firebaseConfig as Record<string, string>);
    // Long polling makes Firestore reliable on React Native / Expo, where the
    // default streaming transport can stall behind some networks.
    firestore = initializeFirestore(app, { experimentalForceLongPolling: true });
  }

  // On web this uses browserLocalPersistence (session survives reloads). Native
  // phone auth isn't supported via the JS SDK here — see lib/phoneAuth.ts.
  // Real reCAPTCHA verification runs in all modes (Blaze + real SMS).
  firebaseAuth = getAuth(app);
}

/** Firestore instance, or `null` until the team wires up the Firebase config. */
export const db = firestore;

/** Auth instance, or `null` until the Firebase config is provided. */
export const auth = firebaseAuth;

export default app;
