/**
 * ClaimNest - Date Utilities
 * 
 * Demonstrates Unit II (Client-Side JavaScript):
 * - Date object manipulation
 * - Mathematical operations (milliseconds to days conversion)
 * - String formatting for friendly display
 */

/**
 * Calculates the number of days remaining until a target date.
 * Compares both dates at midnight (00:00:00) to avoid timezone/time-of-day offsets.
 * 
 * @param {string} targetDateString - Date in 'YYYY-MM-DD' format
 * @returns {number} - Positive for future dates, negative for past/expired dates
 */
export function calculateDaysRemaining(targetDateString) {
  if (!targetDateString) return 0;

  // 1. Get today's date and reset time to midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 2. Parse the target date and reset time to midnight
  const target = new Date(targetDateString);
  target.setHours(0, 0, 0, 0);

  // 3. Difference in milliseconds
  const diffInMs = target.getTime() - today.getTime();

  // 4. Convert milliseconds to integer days: (1000ms * 60s * 60m * 24h)
  const msInOneDay = 1000 * 60 * 60 * 24;
  const diffInDays = Math.round(diffInMs / msInOneDay);

  return diffInDays;
}

/**
 * Determines the status string based on days remaining:
 * - 'Expired' if days < 0
 * - 'Expiring Soon' if 0 to 7 days remain
 * - 'Active' if more than 7 days remain
 * 
 * @param {string} targetDateString - Date string
 * @returns {string} - 'Active' | 'Expiring Soon' | 'Expired'
 */
export function getDeadlineStatus(targetDateString) {
  const days = calculateDaysRemaining(targetDateString);

  if (days < 0) {
    return 'Expired';
  } else if (days <= 7) {
    return 'Expiring Soon';
  } else {
    return 'Active';
  }
}

/**
 * Formats an ISO or SQL date string (YYYY-MM-DD) into a friendly string (e.g. 15 Oct 2026).
 * 
 * @param {string} dateString 
 * @returns {string} Formatted date
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const parsed = new Date(dateString);
  
  if (isNaN(parsed.getTime())) return dateString;
  return parsed.toLocaleDateString('en-GB', options);
}

/**
 * Returns today's date in 'YYYY-MM-DD' format for HTML5 date inputs
 */
export function getTodayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
