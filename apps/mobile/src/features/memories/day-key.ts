import type { DayKey } from "./types";

export function toMonthKey(year: number, month: number): string {
	return `${year}-${String(month).padStart(2, "0")}`;
}

export function toDayKey(monthKey: string, day: number): DayKey {
	return `${monthKey}-${String(day).padStart(2, "0")}` as DayKey;
}

export function toLocalDayKey(date: Date): DayKey {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
		date.getDate(),
	).padStart(2, "0")}` as DayKey;
}

export function parseDayKey(dayKey: DayKey): Date {
	const [yearRaw, monthRaw, dayRaw] = dayKey.split("-");
	return new Date(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw));
}

export function compareDayKeys(a: DayKey, b: DayKey): number {
	return a.localeCompare(b);
}

export function addMonthsToDayKey(dayKey: DayKey, months: number): DayKey {
	const date = parseDayKey(dayKey);
	const next = new Date(date);
	next.setMonth(next.getMonth() + months);
	return toLocalDayKey(next);
}

export function startOfLocalDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function listDayKeysInRange(start: DayKey, end: DayKey): DayKey[] {
	if (compareDayKeys(start, end) > 0) {
		return [];
	}

	const dayKeys: DayKey[] = [];
	const cursor = parseDayKey(start);
	const endDate = parseDayKey(end);

	while (cursor.getTime() <= endDate.getTime()) {
		dayKeys.push(toLocalDayKey(cursor));
		cursor.setDate(cursor.getDate() + 1);
	}

	return dayKeys;
}

export function formatDayKey(
	dayKey: DayKey,
	options: Intl.DateTimeFormatOptions = {
		month: "short",
		day: "numeric",
		year: "numeric",
	},
): string {
	return new Intl.DateTimeFormat("en-US", options).format(parseDayKey(dayKey));
}
