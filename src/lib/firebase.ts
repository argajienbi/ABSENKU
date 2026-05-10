import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import firebaseConfig from "../../firebase-applet-config.json";

export const app = initializeApp(firebaseConfig);

// Initialize Firestore with modern persistent cache configuration
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, firebaseConfig.firestoreDatabaseId);

export const rtdb = getDatabase(app);

export const auth = getAuth(app);
export const storage = getStorage(app);

// Setup FCM
let messagingInstance: any = null;

export const getMessagingInstance = async () => {
  if (messagingInstance) return messagingInstance;
  if (typeof window !== "undefined") {
    try {
      const supported = await isSupported();
      if (supported) {
        messagingInstance = getMessaging(app);
        return messagingInstance;
      }
    } catch (e) {
      console.warn("FCM not supported:", e);
    }
  }
  return null;
};

export const requestFCMPermission = async (vapidKey: string) => {
  try {
    const msg = await getMessagingInstance();
    if (!msg) {
      console.warn("Messaging instance not available");
      return null;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(msg, { vapidKey });
      return token;
    }
    return null;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
};

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
