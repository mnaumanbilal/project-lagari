export function formatPkr(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

const PKT_TIME_ZONE = "Asia/Karachi";

function calendarDayKeyInPkt(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PKT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function yearInPkt(date: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-PK", {
      timeZone: PKT_TIME_ZONE,
      year: "numeric",
    }).format(date),
  );
}

function formatExactNotificationTime(date: Date): string {
  if (calendarDayKeyInPkt(date) === calendarDayKeyInPkt(new Date())) {
    return new Intl.DateTimeFormat("en-PK", {
      timeZone: PKT_TIME_ZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-PK", {
    timeZone: PKT_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatRelativeNotificationWhen(date: Date, now: Date): string {
  const diff = now.getTime() - date.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;

  const sameYear = yearInPkt(date) === yearInPkt(now);
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: PKT_TIME_ZONE,
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}

/** Smart relative label plus exact PKT time (today) or date+time (earlier). */
export function formatNotificationWhen(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const relative = formatRelativeNotificationWhen(date, now);
  const exact = formatExactNotificationTime(date);
  return `${relative} (${exact})`;
}
