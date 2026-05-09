const fs = require('fs');
const content = fs.readFileSync('src/pages/views/ProfileView.tsx', 'utf-8');
const lines = content.split('\n');

fs.mkdirSync('src/pages/views/profile', { recursive: true });

const menuChunk = lines.slice(30, 153).join('\n');
const idCardChunk = lines.slice(156, 301).join('\n');
const changelogChunk = lines.slice(304, 668).join('\n');
const editProfileChunk = lines.slice(671, 710).join('\n');

const createTabFile = (name, chunk) => {
    const fileContent = `import React from 'react';
import { User, Edit, ChevronRight, IdCard, Sun, Moon, LogOut, Bell, Info, ArrowLeft, Activity, Share2, Download, Fingerprint, Check, Code, Camera, Phone, Key, Settings } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { db, auth } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { getEffectiveShiftId } from '../../../lib/dateUtils';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import { requestFCMPermission } from '../../../lib/firebase';
import { useTheme } from 'next-themes';
import { useUserAppContext } from '../UserAppContext';

export const ${name} = () => {
    const { 
        profileTab, setProfileTab, user, settings, resolvedShifts,
        theme, setTheme, idCardSide, setIdCardSide, idCardRef,
        showFaceUpdateCam, setShowFaceUpdateCam, editWebcamRef, editFaceBase64, captureEditFace,
        editName, setEditName, editPhone, setEditPhone, handleResetPassword, handleSaveProfile,
        isEditSaving, handleShareIDCard, handleDownloadIDCard, setView
    } = useUserAppContext();

    const navigate = useNavigate();

    return (
        ${chunk}
    );
};
`;
    fs.writeFileSync(`src/pages/views/profile/${name}.tsx`, fileContent);
}

createTabFile('ProfileMenu', menuChunk);
createTabFile('ProfileIdCard', idCardChunk);
createTabFile('ProfileChangelog', changelogChunk);
createTabFile('ProfileEdit', editProfileChunk);

console.log("Tab files created.");
