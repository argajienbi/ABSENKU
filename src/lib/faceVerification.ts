import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Converts an image URL to base64 by drawing it to a canvas.
// This is often more reliable for CORS than a direct fetch, depending on the origin.
export async function urlToBase64(url: string): Promise<{ mimeType: string, data: string }> {
  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;]+);base64,(.*)$/);
    if (match) return { mimeType: match[1], data: match[2] };
    throw new Error("Invalid data URL");
  }

  const processBlob = (blob: Blob): Promise<{ mimeType: string, data: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const match = result.match(/^data:([^;]+);base64,(.*)$/);
        if (match) {
          resolve({ mimeType: match[1], data: match[2] });
        } else {
           reject(new Error("Failed to parse base64 from blob"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network request failed");
    const blob = await response.blob();
    return await processBlob(blob);
  } catch (error) {
    console.warn("Failed to fetch directly, trying allorigins proxy", error);
    try {
       const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
       const response = await fetch(proxyUrl);
       if (!response.ok) throw new Error("Proxy request failed");
       const blob = await response.blob();
       return await processBlob(blob);
    } catch (proxyError) {
      console.warn("Proxy also failed, falling back to canvas", proxyError);
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("No ctx"));
          ctx.drawImage(img, 0, 0);
          try {
            const dataUrl = canvas.toDataURL("image/jpeg");
            const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
            if (match) resolve({ mimeType: match[1], data: match[2] });
            else reject(new Error("Failed to parse canvas base64"));
          } catch (e) {
            reject(new Error("Canvas tainted by CORS, cannot extract data"));
          }
        };
        img.onerror = () => reject(new Error(`Image failed to load (likely CORS/Firebase Storage rules). URL: ${url}`));
        img.src = url; // do not append random query params that might invalidate signed URLs
      });
    }
  }
}

export type VerificationResult = 'MATCH' | 'NO_MATCH' | 'UNAVAILABLE';

export async function verifyFace(selfieBase64: string, avatarUrl: string): Promise<VerificationResult> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is missing. Skipping verification.");
      return 'UNAVAILABLE';
    }

    const selfieMatch = selfieBase64.match(/^data:([^;]+);base64,(.*)$/);
    if (!selfieMatch) {
       console.error("Selfie base64 does not match expected pattern");
       return 'NO_MATCH';
    }
    
    const selfieMime = selfieMatch[1];
    const selfieBytes = selfieMatch[2];

    const avatar = await urlToBase64(avatarUrl);

    const req = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Analyze the first image (selfie) and the second image (avatar). Rule 1 (Identity): Are the people in these two images the EXACT same person? Rule 2 (Liveness/Anti-Spoofing): Does the first image appear to be a real, live photo taken directly from a webcam/phone camera, and NOT a photo of a screen, NOT a printed photo, and NOT someone wearing a mask to trick the system? If BOTH rules are passed, respond with ONLY 'YES'. Otherwise, respond with 'NO'." },
            { inlineData: { mimeType: selfieMime, data: selfieBytes } },
            { inlineData: { mimeType: avatar.mimeType, data: avatar.data } }
          ]
        }
      ]
    });

    const answer = req.text?.trim().toUpperCase() || "";
    return answer.includes("YES") ? 'MATCH' : 'NO_MATCH';
  } catch (error) {
    console.warn("Face verification skipped:", error instanceof Error ? error.message : String(error));
    // Provide UNAVAILABLE so the flow continues gracefully
    return 'UNAVAILABLE';
  }
}
