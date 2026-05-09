const fs = require('fs');

let content = fs.readFileSync('src/pages/UserApp.tsx', 'utf-8');

// The states to remove
const statesToRemove = [
  '  const \\[myHistory, setMyHistory\\] = useState<any\\[\\]>\\(\\[\\]\\);\\n',
  '  const \\[leaveRequests, setLeaveRequests\\] = useState<any\\[\\]>\\(\\[\\]\\);\\n',
  '  const \\[payroll, setPayroll\\] = useState<any\\[\\]>\\(\\[\\]\\);\\n',
  '  const \\[announcements, setAnnouncements\\] = useState<any\\[\\]>\\(\\[\\]\\);\\n',
  '  const \\[appNotifications, setAppNotifications\\] = useState<any\\[\\]>\\(\\[\\]\\);\\n',
  '  const \\[selectedDate, setSelectedDate\\] = useState\\(new Date\\(\\)\\);\\n'
];

statesToRemove.forEach(state => {
  content = content.replace(new RegExp(state, 'g'), '');
});

// Remove getStatusForDate
const getStatusStartStr = '  const getStatusForDate = React.useCallback((date: Date) => {\n';
const getStatusStartIndex = content.indexOf(getStatusStartStr);
const getStatusEndStr = '  }, [myHistory, settings, user]);\n';
const getStatusEndIndex = content.indexOf(getStatusEndStr, getStatusStartIndex) + getStatusEndStr.length;

if (getStatusStartIndex !== -1) {
    content = content.slice(0, getStatusStartIndex) + content.slice(getStatusEndIndex);
}

// Remove pendingCount, isIzinActive, hasInApproved, hasOutApproved, isTodayHolidayOrWeekend, canEnableOvertime
const removeRegex = /  const (pendingCount|isIzinActive|hasInApproved|hasOutApproved|isTodayHolidayOrWeekend|canEnableOvertime) = .*?;\n/gs;
// Some are multi-line, let's use indexOf instead to be safe.

const chunk1Start = '  const pendingCount = myHistory.filter(log => log.status === \'pending_approval\').length;';
const chunk1End = '  }, [myHistory, resolvedShifts, user]);\n';
const idx1Start = content.indexOf(chunk1Start);
const idx1End = content.indexOf(chunk1End, idx1Start) + chunk1End.length;
if (idx1Start !== -1) {
   content = content.slice(0, idx1Start) + content.slice(idx1End);
}

// Remove summary
const sumStart = '  const summary = React.useMemo(() => {';
const sumEnd = '  }, [myHistory, getStatusForDate]);\n';
const idxSumStart = content.indexOf(sumStart);
const idxSumEnd = content.indexOf(sumEnd, idxSumStart) + sumEnd.length;
if (idxSumStart !== -1) {
   content = content.slice(0, idxSumStart) + content.slice(idxSumEnd);
}

// Remove todayStatusText
const pstStart = '  const todayStatusText = React.useMemo(() => {';
const pstEnd = '  }, [myHistory]);\n';
const idxPstStart = content.indexOf(pstStart);
const idxPstEnd = content.indexOf(pstEnd, idxPstStart) + pstEnd.length;
if (idxPstStart !== -1) {
   content = content.slice(0, idxPstStart) + content.slice(idxPstEnd);
}

// Remove fetch effect
const featStart = '  useEffect(() => {\n    if (!user) return;\n    \n    // Fetch notifications';
const featEnd = '  }, [user]);\n';
const iFeatStart = content.indexOf(featStart);
const iFeatEnd = content.indexOf(featEnd, iFeatStart) + featEnd.length;

if (iFeatStart !== -1) {
    const replacement = `  const {
    myHistory, leaveRequests, payroll, announcements, appNotifications, selectedDate, setSelectedDate,
    getStatusForDate, pendingCount, isIzinActive, hasInApproved, hasOutApproved, isTodayHolidayOrWeekend, canEnableOvertime,
    summary, todayStatusText
  } = useAttendanceData(user, settings, resolvedShifts);\n`;
    content = content.slice(0, iFeatStart) + replacement + content.slice(iFeatEnd);
}

// add import
content = content.replace(
  'import { useUserLocation } from \'.\/hooks\/useUserLocation\';',
  'import { useUserLocation } from \'.\/hooks\/useUserLocation\';\nimport { useAttendanceData } from \'../hooks/useAttendanceData\';'
);

// fix any import duplication if any
content = content.replace(/import \{ useUserLocation \} from '\.\.\/hooks\/useUserLocation';\nimport \{ useUserLocation \} from '\.\.\/hooks\/useUserLocation';/, "import { useUserLocation } from '../hooks/useUserLocation';");


fs.writeFileSync('src/pages/UserApp.tsx', content);
console.log("Done");
