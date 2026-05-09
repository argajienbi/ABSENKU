const fs = require('fs');

let content = fs.readFileSync('src/pages/UserApp.tsx', 'utf-8');

// 1. Add imports
content = content.replace(
  'import { HrisSettings } from "../components/HrisSettings";',
  `import { HrisSettings } from "../components/HrisSettings";
import { HomeView } from './views/HomeView';
import { AbsenView } from './views/AbsenView';
import { HistoryView } from './views/HistoryView';
import { NotificationsView } from './views/NotificationsView';
import { IzinMenuView } from './views/IzinMenuView';
import { ProfileView } from './views/ProfileView';
import { UserAppProvider } from './views/UserAppContext';`
);

// 2. Add contextValue and UserAppProvider at return
const returnBlock = `  return (
    <>
      <div className="h-screen flex flex-col text-gray-900 dark:text-gray-100 overflow-hidden font-sans relative">`;

const replacementReturnBlock = `  const contextValue = {
    isCardExpanded, setIsCardExpanded, currentTime, user, resolvedShifts, 
    settings, location, distance, locationError, currentAreaName, myHistory, 
    setType, setView, canEnableOvertime, pendingCount, announcements,
    type, activeAbsenTab, setActiveAbsenTab, setPendingQRData, setQrUserIdentity,
    isDocumentCapture, permitStartDate, setPermitStartDate, permitEndDate, setPermitEndDate,
    isAbsenMapExpanded, setIsAbsenMapExpanded, isWithinRadius, webcamRef, loading, 
    checkPendingAndStartAttendance, summary, summaryModalCategory, setSummaryModalCategory, 
    selectedDate, setSelectedDate, appNotifications, profileTab, setProfileTab, theme, setTheme, 
    idCardSide, setIdCardSide, idCardRef, showFaceUpdateCam, setShowFaceUpdateCam, editWebcamRef, 
    editFaceBase64, captureEditFace, editName, setEditName, editPhone, setEditPhone, 
    handleResetPassword, handleSaveProfile, isEditSaving, handleShareIDCard, handleDownloadIDCard, view,
    confirmData, setConfirmData, submitAttendance
  };

  return (
    <UserAppProvider value={contextValue}>
      <div className="h-screen flex flex-col text-gray-900 dark:text-gray-100 overflow-hidden font-sans relative">`;

content = content.replace(returnBlock, replacementReturnBlock);

// 3. Replace the massive view section
const startIndex = content.indexOf('{view === "home" && (');
const endIndex = content.indexOf('</div>\n      </div>\n\n      {confirmData && ('); // Before the closing tags and confirmData

if (startIndex !== -1 && endIndex !== -1) {
    const replacementViews = `           {view === "home" && <HomeView />}
           {view === "izin_menu" && <IzinMenuView />}
           {view === "absen" && <AbsenView />}
           {view === "history" && <HistoryView />}
           {view === "notifications" && <NotificationsView />}
           {view === "profile" && <ProfileView />}
        `;
    content = content.substring(0, startIndex) + replacementViews + content.substring(endIndex);
} else {
    console.log("Could not find view section");
}

// 4. Update the closing tags
content = content.replace('    </>\n  );\n}', '    </UserAppProvider>\n  );\n}');

fs.writeFileSync('src/pages/UserApp.tsx', content);
console.log("Done");
