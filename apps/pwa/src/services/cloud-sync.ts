import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  type Firestore,
  type Unsubscribe
} from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';

let db: Firestore | null = null;

function getDb(): Firestore {
  if (!db) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
}

export interface CloudState {
  lifecycleState: string;
  equity: string;
  balance: string;
  dailyRealizedLoss: string;
  activePositionsCount: number;
  totalTrades: number;
  auditEntries: Array<{
    action: string;
    actor: string;
    hash: string;
    time: string;
  }>;
  lastUpdated: unknown; // serverTimestamp
}

const DEFAULT_STATE: CloudState = {
  lifecycleState: 'IDLE',
  equity: '10000',
  balance: '10000',
  dailyRealizedLoss: '0.00',
  activePositionsCount: 0,
  totalTrades: 0,
  auditEntries: [],
  lastUpdated: null
};

/**
 * Save user trading state to Firestore
 */
export async function saveState(userId: string, state: Partial<CloudState>): Promise<void> {
  const ref = doc(getDb(), 'users', userId, 'trading', 'state');
  await setDoc(ref, {
    ...state,
    lastUpdated: serverTimestamp()
  }, { merge: true });
}

/**
 * Load user trading state from Firestore
 */
export async function loadState(userId: string): Promise<CloudState> {
  const ref = doc(getDb(), 'users', userId, 'trading', 'state');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as CloudState;
  }
  // Initialize default state for new user
  await setDoc(ref, { ...DEFAULT_STATE, lastUpdated: serverTimestamp() });
  return DEFAULT_STATE;
}

/**
 * Subscribe to real-time state changes (syncs between devices)
 */
export function subscribeToState(
  userId: string,
  callback: (state: CloudState) => void
): Unsubscribe {
  const ref = doc(getDb(), 'users', userId, 'trading', 'state');
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as CloudState);
    }
  });
}

/**
 * Add an audit entry and sync to cloud
 */
export async function addAuditEntry(
  userId: string,
  entry: { action: string; actor: string; hash: string; time: string }
): Promise<void> {
  const current = await loadState(userId);
  const entries = [entry, ...current.auditEntries.slice(0, 49)];
  await saveState(userId, { auditEntries: entries });
}
