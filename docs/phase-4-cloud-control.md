# Phase 4 Cloud Control Boundary

## Status

`LOCKED` by DEC-080 and DEC-081. This document is the implementation translation for the approved Vercel/Firebase control plane; it does not grant cloud authority over analysis, policy, risk, OMS, or execution.

## Enabled boundary

- Vercel hosts the PWA presentation layer.
- The PWA may initiate Firebase Google Authentication only after an explicit owner click. It uses the Firebase redirect flow, which Firebase recommends for mobile browsers.
- Because the PWA is hosted outside Firebase Hosting, Vercel transparently proxies `/__/auth/*` to `iraniandragons.firebaseapp.com` and the production PWA hostname is used as `authDomain`. This keeps the redirect helper same-origin so browsers that partition third-party storage can retain the authentication result.
- Firebase Authentication is used only to identify the signed-in owner in the UI.
- Missing configuration, a popup failure, an unknown user state, or cloud unavailability remains visible and fail-closed. No pairing or synchronization is attempted.

## Explicitly disabled boundary

- The PWA does not import Firestore, Storage, Analytics, Messaging, Remote Config, Functions, AI, or any broker/market SDK.
- The PWA does not write cloud state, store an executor lease, create a pairing code, issue notifications, or synchronize device metadata.
- The PWA does not hold broker credentials, a pairing secret, a recovery secret, or an execution token.
- Cloud state cannot calculate risk, create `OrderIntent`, or acquire executor authority.

## Configuration handling

The Firebase Web configuration is provided only as Vercel Production environment values with these names:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

These client configuration values are not committed to Git or copied into repository documentation. They are not broker credentials. The PWA treats their absence as `not-configured` and does not initialize Firebase.

Before owner sign-in is tested in production, the Vercel production hostname must be present in Firebase Authentication's authorized-domain list. This is an external-console change and must be evidenced by a successful, owner-initiated sign-in; no account identifier is recorded in Git, logs, or test fixtures.

The Google OAuth client must also authorize `https://ai-trading-system-pwa-drab.vercel.app/__/auth/handler`. The proxy is authentication-only: it does not proxy Firestore, Storage, Functions, Analytics, Messaging, AI, or any trading endpoint.

## Blocked next controls

`OPEN-021` remains open. Its resolution must define and verify device enrollment, mutual confirmation, revocation, recovery, data classes, encryption/key custody, authorization boundaries, and audit evidence before Firestore pairing/synchronization may be enabled. A Firebase login, heartbeat, or user-scoped Firestore rule does not prove exclusive device authority.
