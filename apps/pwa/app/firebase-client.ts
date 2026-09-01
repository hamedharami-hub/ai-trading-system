"use client";

import {
  FirebaseError,
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
} from "firebase/app";
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithRedirect,
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
  | Readonly<{
      kind: "error";
      reason:
        | "authentication-failed"
        | "domain-not-authorized"
        | "network-unavailable"
        | "sign-in-cancelled";
    }>;

function toCloudError(error: unknown): CloudSession {
  if (!(error instanceof FirebaseError)) {
    return { kind: "error", reason: "authentication-failed" };
  }

  switch (error.code) {
    case "auth/unauthorized-domain":
      return { kind: "error", reason: "domain-not-authorized" };
    case "auth/network-request-failed":
      return { kind: "error", reason: "network-unavailable" };
    case "auth/user-cancelled":
    case "auth/redirect-cancelled-by-user":
      return { kind: "error", reason: "sign-in-cancelled" };
    default:
      return { kind: "error", reason: "authentication-failed" };
  }
}

export function observeCloudSession(
  onChange: (session: CloudSession) => void,
): () => void {
  const auth = getFirebaseAuth();
  if (auth === null) {
    onChange({ kind: "not-configured" });
    return () => undefined;
  }

  let redirectResolutionComplete = false;
  let observedUser: User | null = null;
  let disposed = false;

  const unsubscribe = onAuthStateChanged(auth, (user) => {
    observedUser = user;

    // Redirect completion owns the initial result. Publishing an early
    // signed-out observation can otherwise replace a successful redirect
    // result while Firebase restores its persisted session.
    if (!redirectResolutionComplete || disposed) {
      return;
    }

    onChange(
      user === null ? { kind: "signed-out" } : { kind: "signed-in", user },
    );
  });

  void getRedirectResult(auth)
    .then((result) => {
      if (disposed) {
        return;
      }

      redirectResolutionComplete = true;
      const user = result?.user ?? auth.currentUser ?? observedUser;
      onChange(
        user === null ? { kind: "signed-out" } : { kind: "signed-in", user },
      );
    })
    .catch((error: unknown) => {
      if (!disposed) {
        redirectResolutionComplete = true;
        onChange(toCloudError(error));
      }
    });

  return () => {
    disposed = true;
    unsubscribe();
  };
}

export async function signInToCloudControl(): Promise<CloudSession | null> {
  const auth = getFirebaseAuth();
  if (auth === null) {
    return { kind: "not-configured" };
  }

  try {
    await signInWithRedirect(auth, new GoogleAuthProvider());
    return null;
  } catch (error: unknown) {
    return toCloudError(error);
  }
}

export async function signOutFromCloudControl(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth !== null) {
    await signOut(auth);
  }
}
