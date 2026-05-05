export const SHIFTS = {
  shift1: {
    name: "Shift 1",
    label: "Pagi",
    color: "#0d9488", // teal-600
    workDays: {
      0: null, // Sunday
      1: { start: "06:00", end: "14:00" }, 
      2: { start: "06:00", end: "14:00" }, 
      3: { start: "06:00", end: "14:00" }, 
      4: { start: "06:00", end: "14:00" }, 
      5: { start: "06:00", end: "14:00" }, 
      6: { start: "07:00", end: "12:00" }  
    }
  },
  shift2: {
    name: "Shift 2",
    label: "Siang",
    color: "#d97706", // amber-600
    workDays: {
      0: { start: "07:00", end: "12:00" }, 
      1: { start: "13:00", end: "21:00" }, 
      2: { start: "13:00", end: "21:00" }, 
      3: { start: "13:00", end: "21:00" }, 
      4: { start: "13:00", end: "21:00" }, 
      5: { start: "13:00", end: "21:00" }, 
      6: null                              
    }
  },
  shift3: {
    name: "Shift 3",
    label: "Malam",
    color: "#4f46e5", // indigo-600
    workDays: {
      0: { start: "21:00", end: "06:00" },
      1: { start: "21:00", end: "06:00" },
      2: { start: "21:00", end: "06:00" },
      3: { start: "21:00", end: "06:00" },
      4: { start: "21:00", end: "06:00" },
      5: { start: "21:00", end: "06:00" },
      6: { start: "21:00", end: "06:00" }
    }
  }
};

export const WAVE_SVG = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23f9fafb' fill-opacity='0.5' d='M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,213.3C1248,235,1344,213,1392,202.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E\")";
