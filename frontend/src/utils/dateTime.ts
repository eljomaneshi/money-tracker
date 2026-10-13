/**
 * Date and time formatting and parsing utilities for activity items and ledger.
 */

export function getTodayDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getCurrentTimeStr(date: Date = new Date()): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Checks whether an ISO date string has an explicit time component,
 * distinguishing legacy date-only records stored as midnight UTC (T00:00:00.000Z)
 * from new records that record an actual transaction timestamp.
 */
export function hasExplicitTime(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const trimmed = dateStr.trim();
  // Pure date string without time (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;

  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return false;

  // Stored with exact midnight UTC (legacy records created by date-only pickers)
  if (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  ) {
    return false;
  }

  return true;
}

export function formatActivityDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export function formatActivityTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatActivityDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  const dateFormatted = d.toLocaleDateString();
  if (!hasExplicitTime(dateStr)) {
    return dateFormatted;
  }
  return `${dateFormatted} ${formatActivityTime(dateStr)}`;
}

/**
 * Combines local date ("YYYY-MM-DD") and time ("HH:mm") into a full ISO string.
 * Preserves the exact local moment chosen by the user.
 */
export function constructIsoDateTime(dateStr: string, timeStr?: string): string {
  if (!dateStr) return new Date().toISOString();
  const parts = dateStr.trim().split("-");
  if (parts.length !== 3) return new Date(dateStr).toISOString();

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (timeStr && timeStr.trim().includes(":")) {
    const timeParts = timeStr.trim().split(":");
    hours = Number(timeParts[0]) || 0;
    minutes = Number(timeParts[1]) || 0;
    seconds = timeParts.length > 2 ? Number(timeParts[2]) || 0 : new Date().getSeconds() || 1;
  } else {
    const now = new Date();
    if (dateStr.trim() === getTodayDateStr(now)) {
      hours = now.getHours();
      minutes = now.getMinutes();
      seconds = now.getSeconds() || 1;
    } else {
      hours = 12;
      minutes = 0;
      seconds = 1;
    }
  }

  const localDate = new Date(year, month - 1, day, hours, minutes, seconds, 0);
  return localDate.toISOString();
}

export function parseDateAndTimeToInputs(dateStr?: string | null): { date: string; time: string } {
  if (!dateStr) {
    return { date: getTodayDateStr(), time: getCurrentTimeStr() };
  }
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    return { date: getTodayDateStr(), time: getCurrentTimeStr() };
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dateInput = `${y}-${m}-${day}`;

  if (hasExplicitTime(dateStr)) {
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return { date: dateInput, time: `${h}:${min}` };
  }

  return { date: dateInput, time: getCurrentTimeStr() };
}
