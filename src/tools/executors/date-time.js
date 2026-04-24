/**
 * date_time_now and date_time_diff tool handlers.
 *
 * Note on timezones: the breakdown arithmetic uses JavaScript Date's
 * local-time accessors, which means the returned years/months/days are
 * computed against the host machine's local zone. The IANA timezone
 * parameter is used for the human-readable formatting at the end.
 * For the typical dashboard use case (same-zone or UTC inputs) this is
 * accurate; full timezone-aware arithmetic would need a library.
 */

import { formatToolResult, toolError, toolOk } from '../../utils/tool-result.js';

/**
 * Accepts ISO 8601 or common natural formats ("3rd April 2019").
 */
function parseDateString(dateStr) {
  if (!dateStr) return null;
  const cleaned = dateStr.trim();

  const direct = new Date(cleaned);
  if (!isNaN(direct.getTime())) return direct;

  // Strip ordinal suffixes: "3rd" → "3", "21st" → "21".
  const withoutOrdinals = cleaned.replace(/(\d+)(st|nd|rd|th)\b/gi, '$1');
  const retry = new Date(withoutOrdinals);
  if (!isNaN(retry.getTime())) return retry;

  return null;
}

export function executeDateTimeNow(params) {
  const timezone = params.timezone || 'Europe/London';
  try {
    const now = new Date();
    const formatted = now.toLocaleString('en-GB', {
      timeZone: timezone,
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    const isoLocal = now.toLocaleString('sv-SE', { timeZone: timezone }).replace(' ', 'T');
    const tzAbbr  = now.toLocaleString('en-GB', { timeZone: timezone, timeZoneName: 'short' }).split(' ').pop();
    const tzLong  = now.toLocaleString('en-GB', { timeZone: timezone, timeZoneName: 'long' }).split(', ').pop();

    return toolOk('date_time_now', [
      '**Current Date & Time**',
      `Date: ${formatted}`,
      `ISO: ${isoLocal}`,
      `Timezone: ${timezone} (${tzAbbr})`,
      `Full timezone name: ${tzLong}`,
      `Unix timestamp: ${Math.floor(now.getTime() / 1000)}`,
    ].join('\n'));
  } catch (err) {
    const isTz = /time zone|Invalid time zone/i.test(err.message);
    return toolError('date_time_now', isTz
      ? `Invalid timezone "${timezone}". Use IANA format like "Europe/London", "America/New_York", "Asia/Tokyo".`
      : `Failed to get date/time: ${err.message}`);
  }
}

export function executeDateTimeDiff(params) {
  const { from: fromStr, to: toStr } = params;
  const timezone = params.timezone || 'Europe/London';

  if (!fromStr || !toStr) return toolError('date_time_diff', 'Both "from" and "to" dates are required');

  const fromDate = parseDateString(fromStr);
  const toDate   = parseDateString(toStr);
  if (!fromDate) return toolError('date_time_diff', `Could not parse "from" date: "${fromStr}". Use ISO 8601 (e.g. "2019-04-03") or natural format (e.g. "3rd April 2019").`);
  if (!toDate)   return toolError('date_time_diff', `Could not parse "to" date: "${toStr}". Use ISO 8601 (e.g. "2023-06-21") or natural format (e.g. "21st June 2023").`);

  const diffMs = toDate.getTime() - fromDate.getTime();
  const abs = Math.abs(diffMs);
  const direction = diffMs >= 0 ? 'after' : 'before';

  const totalSeconds = Math.floor(abs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours   = Math.floor(totalMinutes / 60);
  const totalDays    = Math.floor(totalHours / 24);
  const totalWeeks   = Math.floor(totalDays / 7);

  const [start, end] = diffMs >= 0 ? [fromDate, toDate] : [toDate, fromDate];
  let years  = end.getFullYear() - start.getFullYear();
  let months = end.getMonth()    - start.getMonth();
  let days   = end.getDate()     - start.getDate();
  let hours   = end.getHours()   - start.getHours();
  let minutes = end.getMinutes() - start.getMinutes();
  let seconds = end.getSeconds() - start.getSeconds();

  if (seconds < 0) { seconds += 60;  minutes--; }
  if (minutes < 0) { minutes += 60;  hours--; }
  if (hours   < 0) { hours   += 24;  days--; }
  if (days < 0) {
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }
  if (months < 0) { months += 12; years--; }

  const fmtOpts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  let fromFormatted, toFormatted;
  try {
    fromFormatted = fromDate.toLocaleString('en-GB', { timeZone: timezone, ...fmtOpts });
    toFormatted   = toDate.toLocaleString('en-GB',   { timeZone: timezone, ...fmtOpts });
  } catch {
    fromFormatted = fromDate.toLocaleString('en-GB', fmtOpts);
    toFormatted   = toDate.toLocaleString('en-GB',   fmtOpts);
  }

  const parts = [];
  if (years   > 0) parts.push(`${years} year${years   !== 1 ? 's' : ''}`);
  if (months  > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
  if (days    > 0) parts.push(`${days} day${days     !== 1 ? 's' : ''}`);
  if (hours   > 0) parts.push(`${hours} hour${hours   !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
  const breakdown = parts.length ? parts.join(', ') : '0 seconds (same instant)';

  const out = [
    '**Date/Time Difference**',
    `From: ${fromFormatted}`,
    `To: ${toFormatted}`,
    `Direction: "to" is ${direction} "from"`,
    '',
    `**Breakdown:** ${breakdown}`,
    '',
    '**Total units:**',
    `- ${totalSeconds.toLocaleString()} seconds`,
    `- ${totalMinutes.toLocaleString()} minutes`,
    `- ${totalHours.toLocaleString()} hours`,
    `- ${totalDays.toLocaleString()} days`,
    `- ${totalWeeks.toLocaleString()} weeks and ${totalDays % 7} day${totalDays % 7 !== 1 ? 's' : ''}`,
  ].join('\n');

  return toolOk('date_time_diff', out);
}
