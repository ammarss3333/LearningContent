/*
 * Firebase initialisation and helper functions.  The Firebase client
 * libraries are pulled from the official CDN.  Note that these
 * imports only work when the page is served with a network connection; on
 * restricted networks the scripts may fail to load.
 */

import { firebaseConfig } from './firebaseConfig.js';

// Import Firebase modules from CDN.  We use the modular v9+ API.
import {
  initializeApp
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import {
  getFirestore,
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
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Initialise Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Sign in using Google popup.  Returns a promise resolving to the user
export function signIn() {
  return signInWithPopup(auth, provider);
}

// Sign out the current user.
export function signOutUser() {
  return signOut(auth);
}

export {
  auth,
  db,
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
