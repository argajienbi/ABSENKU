import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import firebaseConfig from "../../firebase-applet-config.json";

export const app = initializeApp(firebaseConfig);

// Firebase Realtime Database is now the primary database for this project.
// Firestore was removed because the Android frontend will be implemented in
// Sketchware Pro and will read/write the same RTDB JSON paths directly.
export const rtdb = getDatabase(app);

export const auth = getAuth(app);
export const storage = getStorage(app);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface DatabaseErrorInfo {
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

export function handleDatabaseError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: DatabaseErrorInfo = {
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
  console.error("Realtime Database Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Backward-compatible alias while old components are being migrated.
export const handleFirestoreError = handleDatabaseError;
