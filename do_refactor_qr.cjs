const fs = require('fs');

let content = fs.readFileSync('src/pages/UserApp.tsx', 'utf-8');

const effectStart = '  useEffect(() => {\n    let ht5Qrcode: Html5Qrcode | null = null;';
const effectEnd = '  }, [view, activeAbsenTab, type]);\n';
const idxStart = content.indexOf(effectStart);
const idxEnd = content.indexOf(effectEnd, idxStart) + effectEnd.length;

if (idxStart !== -1) {
    const replacement = `  useQRScanner(view, activeAbsenTab, type, user, setPendingQRData, setQrUserIdentity, setActiveAbsenTab);\n`;
    content = content.slice(0, idxStart) + replacement + content.slice(idxEnd);
}

// remove the empty useEffect around line 634:
const emptyEffectStart = '  // Wajah tidak lagi dicek otomatis oleh faceapi\n  useEffect(() => {\n    let interval: any;\n    if (view === "absen" && activeAbsenTab === "selfie" && !loading) {\n       // Visual hint saja, tidak ada face-api\n    }\n    return () => clearInterval(interval);\n  }, [view, activeAbsenTab, loading, autoCaptureActive]);\n';
content = content.replace(emptyEffectStart, '');

content = content.replace(
  'import { useAttendanceData } from \'../hooks/useAttendanceData\';',
  'import { useAttendanceData } from \'../hooks/useAttendanceData\';\nimport { useQRScanner } from \'../hooks/useQRScanner\';'
);

fs.writeFileSync('src/pages/UserApp.tsx', content);
console.log("Done");
