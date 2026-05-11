import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { isSameDay, isWeekend } from "date-fns";
import { isHoliday, getEffectiveShiftId } from "../lib/dateUtils";

export function useAttendanceData(user: any, settings: any, resolvedShifts: any) {
  const [myHistory, setMyHistory] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [appNotifications, setAppNotifications] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getStatusForDate = React.useCallback((date: Date) => {
    const isToday = isSameDay(date, new Date());
    const isFuture = date > new Date() && !isToday;
    
    // User shift settings
    const shiftId = getEffectiveShiftId(user, date);
    const shiftConfig = resolvedShifts[shiftId] || resolvedShifts.shift1;
    const dayOfWeek = date.getDay();
    const dayShift = shiftConfig?.workDays[dayOfWeek];
    const isTodayHoliday = isHoliday(date);
    const isOffDay = !dayShift || isTodayHoliday;

    if (isFuture) return null;

    const userStartDate = user?.workStartDate ? new Date(user.workStartDate) : (user?.createdAt ? new Date(user.createdAt) : new Date(0));
    userStartDate.setHours(0,0,0,0);
    const checkDate = new Date(date);
    checkDate.setHours(0,0,0,0);
    
    let isWithinContract = checkDate >= userStartDate;
    if (user?.workEndDate) {
      const userEndDate = new Date(user.workEndDate);
      userEndDate.setHours(23,59,59,999);
      if (checkDate > userEndDate) {
        isWithinContract = false;
      }
    }

    const dayLogs = myHistory.filter(log => isSameDay(new Date(log.timestamp), date));
    
    const sickLog = dayLogs.find(l => l.type === 'sick');
    if (sickLog) return 'sick';
    const dispensasiLog = dayLogs.find(l => l.type === 'dispensasi');
    if (dispensasiLog) return 'dispensasi';
    const permitLog = dayLogs.find(l => ['permit', 'cuti', 'melahirkan', 'meninggal'].includes(l.type));
    if (permitLog) return 'permit'; 

    const inLogs = dayLogs.filter(l => l.type === 'in');
    const outLogs = dayLogs.filter(l => l.type === 'out');

    if (inLogs.length === 0 && outLogs.length === 0) {
        if (!isOffDay && !isToday && isWithinContract) return 'alpa'; 
        return null; // Don't return 'alpa' for future or before contract
    }

    if (inLogs.length > 0) {
        const sortedIn = [...inLogs].sort((a,b) => a.timestamp - b.timestamp);
        const firstInLog = sortedIn[0];
        
        let isLate = false;
        if (firstInLog.status === 'pending_approval' || firstInLog.status === 'rejected') {
          isLate = true; 
        } else if (!firstInLog.status || firstInLog.status === 'approved') {
          const firstInDate = new Date(firstInLog.timestamp);
          const shiftStartStr = dayShift?.start || shiftConfig?.startTime || "09:00";
          const gracePeriod = shiftConfig?.gracePeriod || 0;
          
          const [startHour, startMin] = shiftStartStr.split(':').map(Number);
          const shiftStartMinutes = (startHour * 60) + startMin + gracePeriod;
          const userInMinutes = (firstInDate.getHours() * 60) + firstInDate.getMinutes();
          
          isLate = userInMinutes > shiftStartMinutes;
        }

        if (outLogs.length === 0 && !isToday && !isOffDay) {
            return 'lupa_pulang';
        }

        if (isLate) return 'telat';
        return 'hadir'; 
    }

    return null;
  }, [myHistory, settings, user, resolvedShifts]);

  const pendingCount = myHistory.filter(log => log.status === 'pending_approval').length;

  const isIzinActive = React.useMemo(() => {
    return myHistory.some(log => isSameDay(new Date(log.timestamp), new Date()) && ['sick', 'permit', 'cuti', 'melahirkan', 'meninggal'].includes(log.type));
  }, [myHistory]);
  
  const hasInApproved = React.useMemo(() => {
     return myHistory.some(log => isSameDay(new Date(log.timestamp), new Date()) && log.type === 'in' && log.status === 'approved');
  }, [myHistory]);

  const hasOutApproved = React.useMemo(() => {
     return myHistory.some(log => isSameDay(new Date(log.timestamp), new Date()) && log.type === 'out' && log.status === 'approved');
  }, [myHistory]);

  const isTodayHolidayOrWeekend = React.useMemo(() => {
     const today = new Date();
     return isWeekend(today) || isHoliday(today);
  }, []);

  const canEnableOvertime = React.useMemo(() => {
     const outLog = myHistory.find(log => isSameDay(new Date(log.timestamp), new Date()) && log.type === 'out' && log.status === 'approved');
     if (!outLog) return false;
     
     const outTime = new Date(outLog.timestamp);
     const now = new Date();
     const minutesSinceOut = (now.getTime() - outTime.getTime()) / (1000 * 60);
     
     // Check shift end time
     const shift = resolvedShifts[getEffectiveShiftId(user, new Date()) || ''];
     const dayOfWeek = new Date().getDay();
     const shiftDay = shift?.workDays?.[dayOfWeek];
     
     if (shiftDay) {
         const [endHour, endMinute] = shiftDay.end.split(':').map(Number);
         const shiftEnd = new Date();
         shiftEnd.setHours(endHour, endMinute, 0, 0);
         
         // If shift ends tomorrow morning, adjust shiftEnd
         if (endHour < 12) { 
             shiftEnd.setDate(shiftEnd.getDate() + 1);
         }
         if (now < shiftEnd) return false;
     }
     
     return minutesSinceOut >= 0 && minutesSinceOut <= 30;
  }, [myHistory, resolvedShifts, user]);

  
  const summary = React.useMemo(() => {
     let telatCount = 0;
     let ijinCount = 0;
     let alpaCount = 0;
     let lemburHours = 0;
     let hadirCount = 0;

     const telatDates: Date[] = [];
     const ijinDates: Date[] = [];
     const alpaDates: Date[] = [];
     const hadirDates: Date[] = [];
     const lemburDetails: {date: Date, hours: number}[] = [];
     
     const now = new Date();
     for (let i = 1; i <= now.getDate(); i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), i);
        const status = getStatusForDate(date);
        
        if (status === 'telat') { telatCount++; telatDates.push(date); }
        if (status === 'sick' || status === 'permit' || status === 'dispensasi') { ijinCount++; ijinDates.push(date); }
        if (status === 'alpa') { alpaCount++; alpaDates.push(date); }
        if (status === 'hadir') { hadirCount++; hadirDates.push(date); }
        
        const dayLogs = myHistory.filter(log => isSameDay(new Date(log.timestamp), date));
        const lemburIn = dayLogs.filter(l => l.type === 'overtime_in').sort((a,b) => a.timestamp - b.timestamp);
        const lemburOut = dayLogs.filter(l => l.type === 'overtime_out').sort((a,b) => b.timestamp - a.timestamp);
        
        if (lemburIn.length > 0 && lemburOut.length > 0) {
            const mSecs = lemburOut[0].timestamp - lemburIn[0].timestamp;
            if (mSecs > 0) {
               const hours = mSecs / (1000 * 60 * 60);
               lemburHours += hours;
               lemburDetails.push({ date, hours });
            }
        }
     }
     
     return { telatCount, ijinCount, alpaCount, lemburHours, hadirCount, telatDates, ijinDates, alpaDates, hadirDates, lemburDetails };
  }, [myHistory, getStatusForDate]);

  const todayStatusText = React.useMemo(() => {
    const todayLogs = myHistory.filter(log => isSameDay(new Date(log.timestamp), new Date()));
    if (todayLogs.length === 0) return "Belum Absen Hari Ini";
    
    const hasOut = todayLogs.some(log => log.type === 'out');
    if (hasOut) return "Sudah Absen Pulang";
    
    const hasLemburOut = todayLogs.some(log => log.type === 'overtime_out');
    if (hasLemburOut) return "Sudah Lembur Pulang";

    const hasLemburIn = todayLogs.some(log => log.type === 'overtime_in');
    if (hasLemburIn) return "Sedang Lembur Masuk";

    const hasIn = todayLogs.some(log => log.type === 'in');
    
    const sickOrPermit = todayLogs.find(log => ['sick', 'permit', 'cuti', 'melahirkan', 'meninggal'].includes(log.type));
    if (sickOrPermit) {
       if (sickOrPermit.type === 'sick') return "Status: Sakit";
       if (sickOrPermit.type === 'cuti') return "Status: Cuti";
       if (sickOrPermit.type === 'melahirkan') return "Status: Melahirkan";
       if (sickOrPermit.type === 'meninggal') return "Status: Berduka";
       return "Status: Izin";
    }

    if (hasIn) return "Sudah Absen Masuk";
    
    return "Sudah Absen";
  }, [myHistory]);

  useEffect(() => {
    if (!user) return;
    
    // Fetch notifications
    const qNotif = query(collection(db, "notifications"), where("userId", "in", [user.uid, "all"]));
    const unsubNotif = onSnapshot(qNotif, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => b.createdAt - a.createdAt);
      setAppNotifications(data);
    });

    // Fetch announcements
    const qAnnouncements = query(collection(db, "announcements"));
    const unsubAnnouncements = onSnapshot(qAnnouncements, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch leave requests
    const qLeave = query(collection(db, "leaveRequests"), where("userId", "==", user.uid));
    const unsubLeave = onSnapshot(qLeave, (snapshot) => {
      setLeaveRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    // Fetch payroll
    const qPayroll = query(collection(db, "payroll"), where("userId", "==", user.uid));
    const unsubPayroll = onSnapshot(qPayroll, (snapshot) => {
      setPayroll(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching payroll data", error);
    });
    
    // Fetch attendance
    const q = query(collection(db, "attendance"), where("userId", "==", user.uid));
    const unsubAttendance = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        const logDate = new Date(docData.timestamp);
        const today = new Date();
        // Remove photo if it is not today
        if (!isSameDay(logDate, today)) {
            delete docData.photoBase64;
        }
        
        return { 
          id: doc.id, 
          ...docData,
          isPending: doc.metadata.hasPendingWrites 
        };
      });
      data.sort((a: any, b: any) => b.timestamp - a.timestamp);
      setMyHistory(data);
    }, (error) => {
      console.error("Error fetching personal data", error);
    });

    return () => { unsubLeave(); unsubPayroll(); unsubAttendance(); unsubAnnouncements(); unsubNotif(); };
  }, [user]);

  return {
    myHistory, leaveRequests, payroll, announcements, appNotifications, selectedDate, setSelectedDate,
    getStatusForDate, pendingCount, isIzinActive, hasInApproved, hasOutApproved, isTodayHolidayOrWeekend, canEnableOvertime,
    summary, todayStatusText, setMyHistory, setLeaveRequests, setPayroll, setAnnouncements, setAppNotifications
  };
}
