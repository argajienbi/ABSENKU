
import { isHoliday as checkHoliday, setCustomHolidays } from "./holidayService";

export { setCustomHolidays };

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

export const isHoliday = (date: Date): boolean => {
  return checkHoliday(date);
};

export const isWorkDay = (date: Date): boolean => {
  return !isWeekend(date) && !isHoliday(date);
};
