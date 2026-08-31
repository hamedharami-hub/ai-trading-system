"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";

type FirebaseRuntimeConfig = Readonly<{
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}>;

const runtimeConfig: FirebaseRuntimeConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

function isConfigured(config: FirebaseRuntimeConfig): boolean {
  return Object.values(config).every((value) => value.length > 0);
}

function getFirebaseApp(): FirebaseApp | null {
  if (!isConfigured(runtimeConfig)) {
    return null;
  }

  return getApps().length > 0 ? getApp() : initializeApp(runtimeConfig);
}

function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  return app === null ? null : getAuth(app);
}

export type CloudSession =
  | Readonly<{ kind: "not-configured" }>
  | Readonly<{ kind: "signed-out" }>
  | Readonly<{ kind: "signed-in"; user: User }>
  | Readonly<{ kind: "error"; reason: "authentication-failed" }>;

export function observeCloudSession(
  onChange: (session: CloudSession) => void,
): () => void {
  const auth = getFirebaseAuth();
  if (auth === null) {
    onChange({ kind: "not-configured" });
    return () => undefined;
  }

  return onAuthStateChanged(auth, (user) => {
    onChange(
      user === null ? { kind: "signed-out" } : { kind: "signed-in", user },
    );
  });
}

export async function signInToCloudControl(): Promise<CloudSession> {
  const auth = getFirebaseAuth();
  if (auth === null) {
    return { kind: "not-configured" };
  }

  try {
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    return { kind: "signed-in", user: credential.user };
  } catch {
    return { kind: "error", reason: "authentication-failed" };
  }
}

export async function signOutFromCloudControl(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth !== null) {
    await signOut(auth);
  }
}
