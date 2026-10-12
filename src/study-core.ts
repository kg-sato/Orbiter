/** Pure scheduling primitives. No DOM, persistence or network side effects. */
namespace StudyCore {
  export interface Interval {
    start: number;
    end: number;
  }
  export interface Step {
    id: string;
    title: string;
    minutes: number;
    done: boolean;
  }
  export interface Day {
    date: string;
    events: Interval[];
    start: number;
    end: number;
  }
  export interface Placement extends Interval {
    date: string;
    stepId: string;
  }

  export function localDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  export function shiftDate(key: string, days: number): string {
    const date = new Date(`${key}T12:00:00`);
    date.setDate(date.getDate() + days);
    return localDate(date);
  }
  export function mergeIntervals(
    events: Interval[],
    start: number,
    end: number,
  ): Interval[] {
    const sorted = events
      .map((event) => ({
        start: Math.max(start, event.start),
        end: Math.min(end, event.end),
      }))
      .filter(
        (event) =>
          Number.isFinite(event.start) &&
          Number.isFinite(event.end) &&
          event.end > event.start,
      )
      .sort((a, b) => a.start - b.start);
    const merged: Interval[] = [];
    for (const event of sorted) {
      const previous = merged[merged.length - 1];
      if (previous && event.start <= previous.end)
        previous.end = Math.max(previous.end, event.end);
      else merged.push({ ...event });
    }
    return merged;
  }
  export function freeSlots(
    events: Interval[],
    start: number,
    end: number,
  ): Interval[] {
    const result: Interval[] = [];
    let cursor = Math.ceil(start / 30) * 30;
    for (const event of mergeIntervals(events, start, end)) {
      if (event.start > cursor)
        result.push({ start: cursor, end: event.start });
      cursor = Math.max(cursor, Math.ceil(event.end / 30) * 30);
    }
    if (cursor < end) result.push({ start: cursor, end });
    return result;
  }
  export function occupied(
    events: Interval[],
    start: number,
    end: number,
  ): number {
    return mergeIntervals(events, start, end).reduce(
      (sum, event) => sum + event.end - event.start,
      0,
    );
  }
  /** Keep step order. If a prerequisite cannot fit, do not schedule later steps ahead of it. */
  export function planSteps(
    steps: Step[],
    days: Day[],
  ): { placements: Placement[]; unplaced: Step[] } {
    const placements: Placement[] = [];
    const unplaced: Step[] = [];
    const working = days.map((day) => ({
      ...day,
      events: day.events.map((event) => ({ ...event })),
    }));
    let lastDate = "",
      lastEnd = 0,
      blocked = false;
    for (const step of steps.filter((step) => !step.done)) {
      let found = false;
      if (!blocked)
        for (const day of working) {
          if (day.date < lastDate) continue;
          const begin =
            day.date === lastDate ? Math.max(day.start, lastEnd) : day.start;
          const slot = freeSlots(day.events, begin, day.end).find(
            (slot) => slot.end - slot.start >= step.minutes,
          );
          if (!slot) continue;
          const placement = {
            date: day.date,
            start: slot.start,
            end: slot.start + step.minutes,
            stepId: step.id,
          };
          placements.push(placement);
          day.events.push(placement);
          lastDate = day.date;
          lastEnd = placement.end;
          found = true;
          break;
        }
      if (!found) {
        unplaced.push(step);
        blocked = true;
      }
    }
    return { placements, unplaced };
  }

  export interface PracticeLog {
    date: string;
    minutes: number;
  }
  export type PracticeFrequency = "none" | "daily" | "weekdays" | "weekly";
  export function practiceScheduled(
    frequency: PracticeFrequency,
    start: string,
    date: string,
  ): boolean {
    if (frequency === "none" || date < start) return false;
    const day = new Date(`${date}T12:00:00`).getDay();
    return (
      frequency === "daily" ||
      (frequency === "weekdays" && day > 0 && day < 6) ||
      (frequency === "weekly" && day === new Date(`${start}T12:00:00`).getDay())
    );
  }
  /** Manual logs record outside-timer work; linked completed sessions count once. */
  export function practiceMinutes(
    taskId: string,
    date: string,
    logs: PracticeLog[],
    sessions: { date: string; minutes: number; taskId?: string | null }[],
  ): number {
    return (
      logs
        .filter((log) => log.date === date)
        .reduce((sum, log) => sum + log.minutes, 0) +
      sessions
        .filter((session) => session.taskId === taskId && session.date === date)
        .reduce((sum, session) => sum + session.minutes, 0)
    );
  }

  export interface CalendarItem {
    id: string;
    title: string;
    date: string;
    start?: string;
    end?: string;
    description?: string;
  }

  /** RFC 5545 TEXT escaping prevents notes from becoming calendar properties. */
  function calendarText(value: string): string {
    return value
      .replace(/\\/g, "\\\\")
      .replace(/\r\n|\r|\n/g, "\\n")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
  }

  /** Fold by UTF-8 octets, never inside a Unicode code point. */
  function foldCalendarLine(line: string): string {
    const encoder = new TextEncoder();
    let output = "",
      octets = 0;
    for (const character of line) {
      const size = encoder.encode(character).length;
      if (octets + size > 75) {
        output += "\r\n ";
        octets = 1;
      }
      output += character;
      octets += size;
    }
    return output;
  }

  function calendarUTC(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  }

  /** One-off snapshot. Timed events use the exporting device's local time zone. */
  export function calendarFile(
    items: CalendarItem[],
    generatedAt: Date,
  ): string {
    const stamp = calendarUTC(generatedAt);
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Scheduler//Study Observatory//EN",
      "CALSCALE:GREGORIAN",
    ];
    for (const item of items) {
      lines.push(
        "BEGIN:VEVENT",
        `UID:${encodeURIComponent(item.id + ":" + item.date)}@scheduler.local`,
        `DTSTAMP:${stamp}`,
      );
      if (item.start && item.end) {
        lines.push(
          `DTSTART:${calendarUTC(new Date(`${item.date}T${item.start}:00`))}`,
          `DTEND:${calendarUTC(new Date(`${item.date}T${item.end}:00`))}`,
        );
      } else {
        lines.push(
          `DTSTART;VALUE=DATE:${item.date.replace(/-/g, "")}`,
          `DTEND;VALUE=DATE:${shiftDate(item.date, 1).replace(/-/g, "")}`,
          "TRANSP:TRANSPARENT",
        );
      }
      lines.push(`SUMMARY:${calendarText(item.title)}`);
      if (item.description)
        lines.push(`DESCRIPTION:${calendarText(item.description)}`);
      lines.push("END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    return lines.map(foldCalendarLine).join("\r\n") + "\r\n";
  }
}
