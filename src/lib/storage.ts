import { ref, uploadString, getDownloadURL, uploadBytesResumable, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

// Simple polyfill for uuidv4 since we might not have uuid package installed, actually let's just make a simple one
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function uploadBase64Image(base64String: string, pathPrefix: string): Promise<string> {
  const fileId = generateUUID();
  const filePath = `${pathPrefix}/${fileId}.jpg`;
  const storageRef = ref(storage, filePath);
  
  // Format needs to be base64url if it's straight base64, but data_url is better if it starts with data:image/...
  const format = base64String.startsWith('data:') ? 'data_url' : 'base64';

  await uploadString(storageRef, base64String, format);
  return await getDownloadURL(storageRef);
}

export async function uploadFileToStorage(file: File, pathPrefix: string): Promise<string> {
  const fileId = generateUUID();
  const extension = file.name.split('.').pop() || 'tmp';
  const filePath = `${pathPrefix}/${fileId}.${extension}`;
  const storageRef = ref(storage, filePath);
  
  const uploadTask = await uploadBytesResumable(storageRef, file);
  return await getDownloadURL(uploadTask.ref);
}

export async function deleteFileFromStorage(url: string): Promise<void> {
  if (!url || !url.includes('firebasestorage.googleapis.com')) return;
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting file from storage:", error);
  }
}
