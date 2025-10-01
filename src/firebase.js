// src/firebase.js
// Firebase initialization and helper functions for Vite/React app

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  // Use initializeFirestore so we can pass connectivity options
  initializeFirestore,
  // (You can still import getFirestore if you need it elsewhere, but not used here)
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';

import { firebaseConfig } from './firebaseConfig.js';

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// Firestore with auto long-polling fallback (helps on GitHub Pages / strict networks)
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  // If you still have issues on very strict proxies, uncomment the next line:
  // experimentalForceLongPolling: true,
});

// --- Auth helpers ---
export function signIn() {
  return signInWithPopup(auth, provider);
}

export function signOutUser() {
  return signOut(auth);
}

// --- Re-exports for convenience ---
export {
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  getDocs,
};
