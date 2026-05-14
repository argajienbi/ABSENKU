import {
  DataSnapshot,
  DatabaseReference,
  QueryConstraint,
  child,
  equalTo,
  get,
  limitToLast,
  off,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  remove,
  set,
  update,
} from "firebase/database";
import { rtdb } from "./firebase";

export type Unsubscribe = () => void;

export function cleanFirebaseKey(key: string) {
  return key.replace(/[.#$\[\]/]/g, "_");
}

export function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function objectFromSnapshot(snapshot: DataSnapshot) {
  const value = snapshot.val();
  return value && typeof value === "object" ? value : null;
}

export function listFromSnapshot<T = any>(snapshot: DataSnapshot): Array<T & { id: string }> {
  const rows: Array<T & { id: string }> = [];
  snapshot.forEach((item) => {
    const value = item.val();
    if (value && typeof value === "object") {
      rows.push({ id: item.key || "", ...value });
    }
  });
  return rows;
}

export function rtdbRef(path: string) {
  return ref(rtdb, path);
}

export async function getObject<T = any>(path: string): Promise<(T & { id?: string }) | null> {
  const snapshot = await get(ref(rtdb, path));
  const value = objectFromSnapshot(snapshot);
  if (!value) return null;
  return { id: snapshot.key || undefined, ...value } as T & { id?: string };
}

export async function getList<T = any>(path: string): Promise<Array<T & { id: string }>> {
  const snapshot = await get(ref(rtdb, path));
  return listFromSnapshot<T>(snapshot);
}

export function listenObject<T = any>(
  path: string,
  next: (value: (T & { id?: string }) | null) => void,
  error?: (error: Error) => void,
): Unsubscribe {
  const dbRef = ref(rtdb, path);
  onValue(
    dbRef,
    (snapshot) => {
      const value = objectFromSnapshot(snapshot);
      next(value ? ({ id: snapshot.key || undefined, ...value } as T & { id?: string }) : null);
    },
    error,
  );
  return () => off(dbRef);
}

export function listenList<T = any>(
  path: string,
  next: (rows: Array<T & { id: string }>) => void,
  error?: (error: Error) => void,
  constraints: QueryConstraint[] = [],
): Unsubscribe {
  const baseRef = ref(rtdb, path);
  const dbQuery: DatabaseReference | ReturnType<typeof query> = constraints.length > 0 ? query(baseRef, ...constraints) : baseRef;
  onValue(
    dbQuery,
    (snapshot) => next(listFromSnapshot<T>(snapshot)),
    error,
  );
  return () => off(dbQuery);
}

export function byChildEquals(childPath: string, value: string | number | boolean) {
  return [orderByChild(childPath), equalTo(value)];
}

export function lastByChild(childPath: string, count: number) {
  return [orderByChild(childPath), limitToLast(count)];
}

export async function setObject(path: string, value: any) {
  await set(ref(rtdb, path), value);
}

export async function updateObject(path: string, value: any) {
  await update(ref(rtdb, path), value);
}

export async function removeObject(path: string) {
  await remove(ref(rtdb, path));
}

export async function pushObject(path: string, value: any) {
  const newRef = push(ref(rtdb, path));
  await set(newRef, value);
  return newRef.key;
}

export async function updateMany(updates: Record<string, any>) {
  await update(ref(rtdb), updates);
}

export async function markIdRefUsed(idRef: string, uid: string) {
  await updateObject(`idRefs/${cleanFirebaseKey(idRef)}`, {
    used: true,
    usedBy: uid,
    usedAt: Date.now(),
  });
}

export async function writeNotification(id: string, payload: any) {
  await setObject(`notifications/${cleanFirebaseKey(id)}`, payload);
}

export async function writeUserNotification(uid: string, payload: any) {
  await setObject(`notificationsByUser/${cleanFirebaseKey(uid)}/${makeId("notif")}`, payload);
}
