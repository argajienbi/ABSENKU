
import { isHoliday as checkHoliday, setCustomHolidays } from "./holidayService";
import { getWeek } from "date-fns";

export { setCustomHolidays };

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

export const getMonthlyShiftKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const getEffectiveShiftId = (user: any, date: Date) => {
    // Check for weekly rotating shifts (if configured in user.weeklyShiftPattern)
    if (user?.weeklyShiftPattern && user?.weeklyShiftPattern.length > 0) {
        const weekNumber = getWeek(date);
        const shiftIndex = weekNumber % user.weeklyShiftPattern.length;
        return user.weeklyShiftPattern[shiftIndex];
    }
    // Fallback to monthly shift or default
    const monthlyShift = user?.monthlyShifts?.[getMonthlyShiftKey(date)];
    if (monthlyShift) return monthlyShift;
    
    if (user?.shiftId && user.shiftId !== 'none') return user.shiftId;
    
    return null; // Return null if no shift is assigned
}

export const isHoliday = (date: Date): boolean => {
  return checkHoliday(date);
};

export const isWorkDay = (date: Date): boolean => {
  return !isWeekend(date) && !isHoliday(date);
};
