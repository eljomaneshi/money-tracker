/**
 * Safely parses transaction date.
 * If date is provided as only YYYY-MM-DD and matches today's date,
 * attaches the current time so the transaction is properly sorted as the latest.
 * If a full ISO datetime string is passed, preserves it exactly.
 */
export function parseTransactionDate(dateInput?: string | Date | null): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;

  const trimmed = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const now = new Date();
    const todayUtc = now.toISOString().slice(0, 10);
    const localYear = now.getFullYear();
    const localMonth = String(now.getMonth() + 1).padStart(2, "0");
    const localDay = String(now.getDate()).padStart(2, "0");
    const todayLocal = `${localYear}-${localMonth}-${localDay}`;

    if (trimmed === todayUtc || trimmed === todayLocal) {
      return now;
    }
  }

  // Support European formats: DD/MM/YYYY, HH:mm or DD.MM.YYYY, HH:mm or DD-MM-YYYY HH:mm
  const euMatch = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?:[,\s]+(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (euMatch) {
    const day = parseInt(euMatch[1], 10);
    const month = parseInt(euMatch[2], 10) - 1;
    let year = parseInt(euMatch[3], 10);
    if (year < 100) year += 2000;
    const hours = euMatch[4] ? parseInt(euMatch[4], 10) : 12;
    const minutes = euMatch[5] ? parseInt(euMatch[5], 10) : 0;
    const seconds = euMatch[6] ? parseInt(euMatch[6], 10) : 0;
    const constructed = new Date(year, month, day, hours, minutes, seconds);
    if (!Number.isNaN(constructed.getTime())) {
      return constructed;
    }
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}
