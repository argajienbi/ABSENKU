import { ref, uploadString, getDownloadURL, uploadBytesResumable, deleteObject, StringFormat } from "firebase/storage";
import { storage } from "./firebase";

// Simple polyfill for uuidv4 since we might not have uuid package installed, actually let's just make a simple one
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Compresses a base64 image (data_url) using an off-screen canvas to save storage space and bandwidth (Spark Plan Optimization).
 */
export async function compressImage(dataUrl: string, maxWidth = 800, quality = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl); // Fallback
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Failed to load image for compression"));
    img.src = dataUrl;
  });
}

export async function uploadBase64Image(base64String: string, pathPrefix: string): Promise<string> {
  const fileId = generateUUID();
  const filePath = `${pathPrefix}/${fileId}.jpg`;
  const storageRef = ref(storage, filePath);
  
  // Format needs to be base64url if it's straight base64, but data_url is better if it starts with data:image/...
  let format: StringFormat = (base64String.startsWith('data:') ? 'data_url' : 'base64') as StringFormat;
  let processedBase64 = base64String;

  // Compress if it is a data URL to save quota
  if (format === 'data_url') {
    try {
      processedBase64 = await compressImage(base64String, 800, 0.6);
    } catch (e) {
      console.warn("Compression failed, using original base64", e);
    }
  }

  await uploadString(storageRef, processedBase64, format);
  return await getDownloadURL(storageRef);
}

export async function uploadFileToStorage(file: File, pathPrefix: string): Promise<string> {
  const fileId = generateUUID();
  const extension = file.name.split('.').pop() || 'tmp';
  const filePath = `${pathPrefix}/${fileId}.${extension}`;
  const storageRef = ref(storage, filePath);
  
  if (file.type.startsWith('image/')) {
    try {
      // Convert file to data url
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
      
      const compressedDataUrl = await compressImage(dataUrl, 1024, 0.7);
      
      // Convert back to blob handling both variants
      const res = await fetch(compressedDataUrl);
      const blob = await res.blob();
      
      const uploadTask = await uploadBytesResumable(storageRef, blob, { contentType: 'image/jpeg' });
      return await getDownloadURL(uploadTask.ref);
    } catch (e) {
      console.warn("Failed to compress image file, uploading original", e);
    }
  }

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
