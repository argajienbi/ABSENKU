import { useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";

export function useQRScanner(
  view: string,
  activeAbsenTab: string,
  type: string,
  user: any,
  setPendingQRData: (data: string) => void,
  setQrUserIdentity: (identity: any) => void,
  setActiveAbsenTab: (tab: string) => void
) {
  useEffect(() => {
    let ht5Qrcode: Html5Qrcode | null = null;
    let isMounted = true;
    let timer: any;
    
    if (view === "absen" && activeAbsenTab === "qr") {
      const startScanner = async () => {
        try {
          ht5Qrcode = new Html5Qrcode("qr-reader");
          await ht5Qrcode.start(
            { facingMode: "environment" },
            {
               fps: 10,
               qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
               if (ht5Qrcode && ht5Qrcode.isScanning) {
                  ht5Qrcode.stop().then(async () => {
                      ht5Qrcode?.clear();
                      if (isMounted) {
                         toast.info("Barcode Terbaca. Mohon ambil foto untuk verifikasi.");
                         setPendingQRData(decodedText);
                         const scannedUid = decodedText;
                         setQrUserIdentity({ 
                            uid: scannedUid, 
                            name: "Pengguna (via Barcode)", 
                            shiftId: user?.shiftId || "shift1" 
                         });
                         toast.success(`Identitas Terbaca. Lanjutkan verifikasi wajah.`);
                         setActiveAbsenTab("selfie");
                      }
                  }).catch((err) => console.error("Error stopping scanner", err));
               }
            },
            () => {} // ignore scan failures
          );
          
          if (!isMounted && ht5Qrcode && ht5Qrcode.isScanning) {
             ht5Qrcode.stop().then(() => ht5Qrcode?.clear()).catch(console.error);
          }
        } catch (e) {
          console.error("QR scanner start error: ", e);
        }
      };

      timer = setTimeout(() => {
        if (isMounted) {
          startScanner();
        }
      }, 500);

      return () => { 
        isMounted = false;
        clearTimeout(timer);
        if (ht5Qrcode && ht5Qrcode.isScanning) {
           ht5Qrcode.stop().then(() => {
              ht5Qrcode?.clear();
           }).catch(console.error);
        }
      };
    }
  }, [view, activeAbsenTab, type, user]);
}
