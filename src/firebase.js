// Firebase initialization and helper functions for Vite/React app
//
// We import Firebase modules from the npm package rather than loading them
// from a CDN.  This allows Vite to bundle the code and makes the
// application fully static.  To configure your own Firebase project,
// update the values in src/firebaseConfig.js.

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
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
} from 'firebase/firestore';

import { firebaseConfig } from './firebaseConfig.js';

// Initialise Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Sign in using Google popup
export function signIn() {
  return signInWithPopup(auth, provider);
}

// Sign out the current user
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