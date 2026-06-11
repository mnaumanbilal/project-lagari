const PKT = "Asia/Karachi";
const MAX_SPAN_DAYS = 366;

export type AnalyticsPreset =
  | "this_week"
  | "last_7_days"
  | "this_month"
  | "this_year"
  | "last_30_days";

export type AnalyticsRange = {
  preset?: AnalyticsPreset;
  from: Date;
  to: Date;
  label: string;
};

type PktParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
};

function getPktParts(date: Date): PktParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: PKT,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = fmt.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 0,
  };
  const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "Mon";

  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    weekday: weekdayMap[weekdayStr] ?? 1,
  };
}

/** PKT calendar midnight for Y-M-D as a UTC Date instant. */
function pktMidnightUtc(year: number, month: number, day: number): Date {
  const pktAsUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  return new Date(pktAsUtcMs - 5 * 60 * 60 * 1000);
}

function pktNow(): Date {
  return new Date();
}

function startOfPktDay(date = pktNow()): Date {
  const { year, month, day } = getPktParts(date);
  return pktMidnightUtc(year, month, day);
}

function addPktDays(base: Date, days: number): Date {
  const { year, month, day } = getPktParts(base);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return pktMidnightUtc(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

function formatPktLabel(from: Date, to: Date): string {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: PKT,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const fromStr = fmt.format(from);
  const toStr = fmt.format(to);
  if (fromStr === toStr) return `${fromStr}, PKT`;
  return `${fromStr} – ${toStr}, PKT`;
}

function mondayOfPktWeek(date = pktNow()): Date {
  const { year, month, day, weekday } = getPktParts(date);
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  return addPktDays(pktMidnightUtc(year, month, day), mondayOffset);
}

function resolvePreset(preset: AnalyticsPreset): AnalyticsRange {
  const to = pktNow();
  let from: Date;
  let label: string;

  switch (preset) {
    case "this_week":
      from = mondayOfPktWeek(to);
      label = "This week (Mon–now, PKT)";
      break;
    case "last_7_days":
      from = addPktDays(startOfPktDay(to), -6);
      label = "Last 7 days, PKT";
      break;
    case "this_month": {
      const { year, month } = getPktParts(to);
      from = pktMidnightUtc(year, month, 1);
      label = "This month, PKT";
      break;
    }
    case "this_year": {
      const { year } = getPktParts(to);
      from = pktMidnightUtc(year, 1, 1);
      label = "This year, PKT";
      break;
    }
    case "last_30_days":
      from = addPktDays(startOfPktDay(to), -29);
      label = "Last 30 days, PKT";
      break;
    default:
      from = addPktDays(startOfPktDay(to), -6);
      label = "Last 7 days, PKT";
  }

  return { preset, from, to, label };
}

function parseDateInput(raw: string, endOfDay = false): Date {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Invalid date range");

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-").map(Number);
    const base = pktMidnightUtc(y, m, d);
    if (endOfDay) {
      return new Date(base.getTime() + 24 * 60 * 60 * 1000 - 1);
    }
    return base;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) throw new Error("Invalid date range");
  return parsed;
}

export type AnalyticsRangeQuery = {
  preset?: string;
  from?: string;
  to?: string;
  days?: string;
};

const PRESETS = new Set<AnalyticsPreset>([
  "this_week",
  "last_7_days",
  "this_month",
  "this_year",
  "last_30_days",
]);

export function resolveAnalyticsRange(query: AnalyticsRangeQuery): AnalyticsRange {
  if (query.from && query.to) {
    const from = parseDateInput(query.from, false);
    const to = parseDateInput(query.to, true);
    if (from > to) throw new Error("from must be before to");
    const spanMs = to.getTime() - from.getTime();
    if (spanMs > MAX_SPAN_DAYS * 24 * 60 * 60 * 1000) {
      throw new Error(`Date range cannot exceed ${MAX_SPAN_DAYS} days`);
    }
    if (to.getTime() > Date.now() + 60 * 1000) {
      throw new Error("to cannot be in the future");
    }
    return {
      from,
      to,
      label: formatPktLabel(from, to),
    };
  }

  if (query.preset && PRESETS.has(query.preset as AnalyticsPreset)) {
    return resolvePreset(query.preset as AnalyticsPreset);
  }

  const days = Number(query.days ?? 7);
  if (days === 30) return resolvePreset("last_30_days");
  return resolvePreset("last_7_days");
}
