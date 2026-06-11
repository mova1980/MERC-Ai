/**
 * Utility functions for Jalali (Persian Shamsi) date and time formatting
 * utilizing the native browser Intl.DateTimeFormat APIs.
 */

export function formatShamsiDate(dateInput?: string | Date | number): string {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return "نامشخص";
    return new Intl.DateTimeFormat("fa-IR", {
      calendar: "persian",
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(d);
  } catch (e) {
    return "نامشخص";
  }
}

export function formatShamsiTime(dateInput?: string | Date | number): string {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return "نامشخص";
    return new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(d);
  } catch (e) {
    return "نامشخص";
  }
}

export function getFullPersianDateTime(dateInput?: string | Date | number): string {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return "نامشخص";
    return new Intl.DateTimeFormat("fa-IR", {
      calendar: "persian",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(d);
  } catch (e) {
    return "نامشخص";
  }
}
