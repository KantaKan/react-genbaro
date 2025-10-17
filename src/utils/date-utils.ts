/**
 * Validates if a string or Date object is a valid date
 */
export function isValidDate(date: string | Date | undefined | null): boolean {
  if (!date) return false;

  const d = new Date(date);
  // Check if the date is valid and not NaN
  return !isNaN(d.getTime());
}

/**
 * Formats a date string or Date object to a localized date string
 * If the date is invalid, returns a fallback string
 */
export function formatDate(date: string | Date | undefined | null, fallback = "Unknown date"): string {
  if (!isValidDate(date)) return fallback;

  try {
    const d = new Date(date);
    return d.toLocaleDateString();
  } catch (error) {
    console.error(`Error formatting date: ${date}`, error);
    return fallback;
  }
}

/**
 * Attempts to fix common date format issues
 * Returns the fixed date string or null if unfixable
 */
export function attemptDateFix(dateStr: string | undefined | null): string | null {
  if (!dateStr) return null;

  // Already valid
  if (isValidDate(dateStr)) return dateStr;

  try {
    // Try different date formats
    const formats = [
      // Try parsing as ISO format with different separators
      dateStr.replace(/[.-]/g, "/"),
      // Try swapping month and day for US/EU format differences
      dateStr.split(/[-./]/).reverse().join("/"),
      // Add more format attempts as needed
    ];

    for (const format of formats) {
      if (isValidDate(format)) {
        return new Date(format).toISOString();
      }
    }

    // If we have what looks like a timestamp
    if (/^\d+$/.test(dateStr)) {
      const timestamp = Number.parseInt(dateStr, 10);
      const date = new Date(timestamp);
      if (isValidDate(date)) {
        return date.toISOString();
      }
    }

    return null;
  } catch (error) {
    console.error(`Failed to fix date format for: ${dateStr}`, error);
    return null;
  }
}

/**
 * Gets today's date as an ISO string (YYYY-MM-DD)
 */
export function getTodayISOString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

export const HOLIDAYS = [
  new Date("2025-04-07"), // Specific holiday
  // Thai holidays (add more as needed)
  new Date("2025-04-13"), // Songkran Day 1
  new Date("2025-04-14"), // Songkran Day 2
  new Date("2025-04-15"), // Songkran Day 3
  new Date("2025-05-01"), // 
  new Date("2025-05-05"), // 
  new Date("2025-08-12"), // วันแม่
  new Date("2025-05-12"), // Add more holidays here...
].map((date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
});

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

// Helper function to check if a date is a holiday
export const isHoliday = (date: Date): boolean => {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return HOLIDAYS.some((holiday) => holiday.getTime() === normalizedDate.getTime());
};

// Function to check if a date is a valid workday (not weekend, not holiday)
export const isValidWorkday = (date: Date): boolean => {
  return !isWeekend(date) && !isHoliday(date);
};

// Function to get the previous valid workday
export const getPreviousWorkday = (date: Date): Date => {
  const prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - 1);

  while (!isValidWorkday(prevDate)) {
    prevDate.setDate(prevDate.getDate() - 1);
  }

  return prevDate;
};
