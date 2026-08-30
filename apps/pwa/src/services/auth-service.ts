import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type Auth,
  type User
} from 'firebase/auth';
import { firebaseConfig } from './firebase-config.js';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function getApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

function getAuthInstance(): Auth {
  if (!auth) {
    auth = getAuth(getApp());
  }
  return auth;
}

export async function signUp(email: string, password: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(getAuthInstance(), email, password);
  return cred.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(getAuthInstance(), email, password);
  return cred.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getAuthInstance());
}

export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  return firebaseOnAuthStateChanged(getAuthInstance(), callback);
}

export function getCurrentUser(): User | null {
  return getAuthInstance().currentUser;
}
