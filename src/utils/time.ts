export interface LogicalClock {
  logicalDate: string;
  minute: number;
  localDate: string;
  localHour: number;
  localMinute: number;
}
function zonedParts(now: Date, timeZone: string): Record<string, number> {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });
  return Object.fromEntries(
    formatter.formatToParts(now)
      .filter(part => part.type !== "literal")
      .map(part => [part.type, Number(part.value)])
  );
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  if (year == null || month == null || day == null) throw new Error(`无效日期：${date}`);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return `${value.getUTCFullYear()}-${pad2(value.getUTCMonth() + 1)}-${pad2(value.getUTCDate())}`;
}

export function logicalClock(now: Date, timeZone: string, boundaryHour: number): LogicalClock {
  const parts = zonedParts(now, timeZone);
  const year = parts.year;
  const month = parts.month;
  const day = parts.day;
  const hour = parts.hour;
  const minute = parts.minute;
  if (year == null || month == null || day == null || hour == null || minute == null) {
    throw new Error(`无法按时区 ${timeZone} 解析当前时间`);
  }
  const localDate = `${year}-${pad2(month)}-${pad2(day)}`;
  const beforeBoundary = hour < boundaryHour;
  return {
    logicalDate: beforeBoundary ? addDays(localDate, -1) : localDate,
    minute: hour * 60 + minute + (beforeBoundary ? 1440 : 0),
    localDate,
    localHour: hour,
    localMinute: minute
  };
}

export function localDateTime(logicalDate: string, minute: number): string {
  const dayOffset = Math.floor(minute / 1440);
  const normalized = ((minute % 1440) + 1440) % 1440;
  const date = addDays(logicalDate, dayOffset);
  return `${date}T${pad2(Math.floor(normalized / 60))}:${pad2(normalized % 60)}:00`;
}
