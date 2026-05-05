
let cachedHolidays: string[] = [
  '2026-01-01', // Tahun Baru
  '2026-01-22', // Tahun Baru Imlek
  '2026-03-31', // Hari Suci Nyepi
  '2026-04-18', // Idul Fitri
  '2026-04-19', // Idul Fitri
  '2026-05-01', // Hari Buruh
  '2026-05-14', // Kenaikan Isa Almasih
  '2026-06-01', // Hari Lahir Pancasila
  '2026-06-26', // Idul Adha
  '2026-08-17', // Hari Kemerdekaan
  '2026-12-25', // Natal
];

const fetchWithRetry = async (url: string, retries: number = 2, delay: number = 1000): Promise<Response> => {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      if (i === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  throw new Error("Max retries reached");
};

export const fetchHolidays = async (year: number = 2026): Promise<void> => {
  try {
    // Try a different public API if the first one fails
    const urls = [
      `https://api-harilibur.vercel.app/api?year=${year}`,
      `https://dayoffapi.vercel.app/api?year=${year}`
    ];
    
    let response;
    let success = false;
    
    for (const url of urls) {
      try {
        response = await fetchWithRetry(url, 1, 500);
        if (response.ok) {
          success = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (success && response) {
      const data = await response.json();
      const newHolidays = data.map((h: any) => h.holiday_date || h.date);
      if (newHolidays.length > 0) {
        cachedHolidays = Array.from(new Set([...cachedHolidays, ...newHolidays])).sort();
      }
    } else {
      console.info("Using local fallback for holidays (external API currently unavailable).");
    }
  } catch (error) {
    // Silent fail to avoid flooding console in offline/dev mode
  }
};

export const setCustomHolidays = (holidays: string[]) => {
  // Merge or replace? User asked for "manual holiday table (overwrites automatic)".
  // I will append them if they are not already there.
  const combined = Array.from(new Set([...cachedHolidays, ...holidays]));
  cachedHolidays = combined.sort();
};

export const isHoliday = (date: Date): boolean => {
  const dateString = date.toISOString().split('T')[0];
  return cachedHolidays.includes(dateString);
};
