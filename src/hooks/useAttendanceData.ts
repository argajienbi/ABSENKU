import React, { useState, useEffect } from "react";
import { isSameDay, isWeekend } from "date-fns";
import { isHoliday, getEffectiveShiftId } from "../lib/dateUtils";
import { byChildEquals, listenList } from "../lib/rtdbService";

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
    const shiftId = getEffectiveShiftId(user, date);
    const shiftConfig = resolvedShifts[shiftId] || resolvedShifts.shift1;
    const dayOfWeek = date.getDay();
    const dayShift = shiftConfig?.workDays?.[dayOfWeek];
    const isTodayHoliday = isHoliday(date);
    const isOffDay = !dayShift || isTodayHoliday;

    if (isFuture) return null;

    const userStartDate = user?.workStartDate ? new Date(user.workStartDate) : (user?.createdAt ? new Date(user.createdAt) : new Date(0));
    userStartDate.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    let isWithinContract = checkDate >= userStartDate;
    if (user?.workEndDate) {
      const userEndDate = new Date(user.workEndDate);
      userEndDate.setHours(23, 59, 59, 999);
      if (checkDate > userEndDate) isWithinContract = false;
    }

    const dayLogs = myHistory.filter(log => isSameDay(new Date(log.timestamp), date));
    const sickLog = dayLogs.find(l => l.type === "sick");
    if (sickLog) return "sick";
    const dispensasiLog = dayLogs.find(l => l.type === "dispensasi");
    if (dispensasiLog) return "dispensasi";
    const permitLog = dayLogs.find(l => ["permit", "cuti", "melahirkan", "meninggal"].includes(l.type));
    if (permitLog) return "permit";

    const inLogs = dayLogs.filter(l => l.type === "in");
    const outLogs = dayLogs.filter(l => l.type === "out");

    if (inLogs.length === 0 && outLogs.length === 0) {
      if (!isOffDay && !isToday && isWithinContract) return "alpa";
      return null;
    }

    if (inLogs.length > 0) {
      const firstInLog = [...inLogs].sort((a, b) => a.timestamp - b.timestamp)[0];
      let isLate = false;
      if (firstInLog.status === "pending_approval" || firstInLog.status === "rejected") {
        isLate = true;
      } else if (!firstInLog.status || firstInLog.status === "approved") {
        const firstInDate = new Date(firstInLog.timestamp);
        const shiftStartStr = dayShift?.start || shiftConfig?.startTime || "09:00";
        const gracePeriod = shiftConfig?.gracePeriod || 0;
        const [startHour, startMin] = shiftStartStr.split(":").map(Number);
        const shiftStartMinutes = (startHour * 60) + startMin + gracePeriod;
        const userInMinutes = (firstInDate.getHours() * 60) + firstInDate.getMinutes();
        isLate = userInMinutes > shiftStartMinutes;
      }

      if (outLogs.length === 0 && !isToday && !isOffDay) return isLate ? "telat_lupa_pulang" : "lupa_pulang";
      if (isLate) return "telat";
      return "hadir";
    }

    if (outLogs.length > 0) return "lupa_masuk";
    return null;
  }, [myHistory.length, JSON.stringify(settings), JSON.stringify(user), JSON.stringify(resolvedShifts)]);

  const pendingCount = myHistory.filter(log => log.status === "pending_approval").length;
  const isIzinActive = React.useMemo(() => myHistory.some(log => isSameDay(new Date(log.timestamp), new Date()) && ["sick", "permit", "cuti", "melahirkan", "meninggal"].includes(log.type)), [myHistory.length]);
  const hasInApproved = React.useMemo(() => myHistory.some(log => isSameDay(new Date(log.timestamp), new Date()) && log.type === "in" && log.status === "approved"), [myHistory.length]);
  const hasOutApproved = React.useMemo(() => myHistory.some(log => isSameDay(new Date(log.timestamp), new Date()) && log.type === "out" && log.status === "approved"), [myHistory.length]);
  const isTodayHolidayOrWeekend = React.useMemo(() => isWeekend(new Date()) || isHoliday(new Date()), []);

  const canEnableOvertime = React.useMemo(() => {
    const outLog = myHistory.find(log => isSameDay(new Date(log.timestamp), new Date()) && log.type === "out" && log.status === "approved");
    if (!outLog) return false;
    const outTime = new Date(outLog.timestamp);
    const now = new Date();
    const minutesSinceOut = (now.getTime() - outTime.getTime()) / (1000 * 60);
    return minutesSinceOut >= 0 && minutesSinceOut <= 30;
  }, [myHistory.length]);

  const summary = React.useMemo(() => {
    let telatCount = 0, ijinCount = 0, alpaCount = 0, lemburHours = 0, hadirCount = 0, lupaPulangCount = 0, lupaMasukCount = 0;
    const telatDates: Date[] = [], ijinDates: Date[] = [], alpaDates: Date[] = [], hadirDates: Date[] = [], lupaPulangDates: Date[] = [], lupaMasukDates: Date[] = [];
    const lemburDetails: { date: Date, hours: number }[] = [];
    const now = new Date();
    for (let i = 1; i <= now.getDate(); i++) {
      const date = new Date(now.getFullYear(), now.getMonth(), i);
      const status = getStatusForDate(date);
      if (status === "telat" || status === "telat_lupa_pulang") { telatCount++; telatDates.push(date); hadirCount++; hadirDates.push(date); if (status === "telat_lupa_pulang") { lupaPulangCount++; lupaPulangDates.push(date); } }
      else if (status === "sick" || status === "permit" || status === "dispensasi") { ijinCount++; ijinDates.push(date); }
      else if (status === "alpa") { alpaCount++; alpaDates.push(date); }
      else if (status === "hadir" || status === "lupa_pulang" || status === "lupa_masuk") { hadirCount++; hadirDates.push(date); if (status === "lupa_pulang") { lupaPulangCount++; lupaPulangDates.push(date); } else if (status === "lupa_masuk") { lupaMasukCount++; lupaMasukDates.push(date); } }
      const dayLogs = myHistory.filter(log => isSameDay(new Date(log.timestamp), date));
      const lemburIn = dayLogs.filter(l => l.type === "overtime_in").sort((a, b) => a.timestamp - b.timestamp);
      const lemburOut = dayLogs.filter(l => l.type === "overtime_out").sort((a, b) => b.timestamp - a.timestamp);
      if (lemburIn.length > 0 && lemburOut.length > 0) {
        const mSecs = lemburOut[0].timestamp - lemburIn[0].timestamp;
        if (mSecs > 0) { const hours = mSecs / (1000 * 60 * 60); lemburHours += hours; lemburDetails.push({ date, hours }); }
      }
    }
    return { telatCount, ijinCount, alpaCount, lemburHours, hadirCount, lupaPulangCount, lupaMasukCount, telatDates, ijinDates, alpaDates, hadirDates, lupaPulangDates, lupaMasukDates, lemburDetails };
  }, [myHistory.length, getStatusForDate]);

  const todayStatusText = React.useMemo(() => {
    const todayLogs = myHistory.filter(log => isSameDay(new Date(log.timestamp), new Date()));
    if (todayLogs.length === 0) return "Belum Absen Hari Ini";
    const hasOut = todayLogs.some(log => log.type === "out");
    const hasIn = todayLogs.some(log => log.type === "in");
    if (hasOut && hasIn) return "Sudah Absen Pulang";
    if (hasOut && !hasIn) return "Hadir (Lupa Masuk)";
    if (todayLogs.some(log => log.type === "overtime_out")) return "Sudah Lembur Pulang";
    if (todayLogs.some(log => log.type === "overtime_in")) return "Sedang Lembur Masuk";
    const sickOrPermit = todayLogs.find(log => ["sick", "permit", "cuti", "melahirkan", "meninggal"].includes(log.type));
    if (sickOrPermit) return sickOrPermit.type === "sick" ? "Status: Sakit" : sickOrPermit.type === "cuti" ? "Status: Cuti" : sickOrPermit.type === "melahirkan" ? "Status: Melahirkan" : sickOrPermit.type === "meninggal" ? "Status: Berduka" : "Status: Izin";
    if (hasIn && !hasOut) return "Hadir (Belum/Lupa Pulang)";
    return "Sudah Absen";
  }, [myHistory]);

  useEffect(() => {
    if (!user) return;
    const unsubNotifUser = listenList(`notificationsByUser/${user.uid}`, (data) => setAppNotifications(data.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))));
    const unsubNotifAll = listenList("notifications", (data) => setAppNotifications(prev => [...prev, ...data.filter((n: any) => ["all", user.uid].includes(n.userId))].sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))));
    const unsubAnnouncements = listenList("announcements", (data) => setAnnouncements(data.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))));
    const unsubLeave = listenList("leaveRequests", (data) => setLeaveRequests(data.filter((x: any) => x.userId === user.uid)));
    const unsubPayroll = listenList("payroll", (data) => setPayroll(data.filter((x: any) => x.userId === user.uid)));
    const unsubAttendance = listenList("attendance", (data) => {
      const rows = data.filter((x: any) => x.userId === user.uid).map((log: any) => {
        const copy = { ...log };
        if (!isSameDay(new Date(copy.timestamp), new Date())) delete copy.photoBase64;
        return copy;
      }).sort((a: any, b: any) => b.timestamp - a.timestamp);
      setMyHistory(rows);
    }, undefined, byChildEquals("userId", user.uid));

    return () => { unsubNotifUser(); unsubNotifAll(); unsubAnnouncements(); unsubLeave(); unsubPayroll(); unsubAttendance(); };
  }, [user]);

  return { myHistory, leaveRequests, payroll, announcements, appNotifications, selectedDate, setSelectedDate, getStatusForDate, pendingCount, isIzinActive, hasInApproved, hasOutApproved, isTodayHolidayOrWeekend, canEnableOvertime, summary, todayStatusText, setMyHistory, setLeaveRequests, setPayroll, setAnnouncements, setAppNotifications };
}
