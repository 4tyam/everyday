import { compareDayKeys } from "../memories/day-key";
import { getMemoriesDb } from "../memories/local-db";
import type { DayKey, DayMemory } from "../memories/types";
import type { Trip, TripId } from "./types";

type TripRow = {
	id: string;
	user_id: string;
	name: string;
	start_day_key: string;
	end_day_key: string;
	created_at: number;
	updated_at: number;
};

type MemoryRow = {
	id: string;
	user_id: string;
	day_key: string;
	local_uri: string;
	image_width: number | null;
	image_height: number | null;
	dominant_color: string | null;
	remote_url: string | null;
	sync_status: DayMemory["syncStatus"];
	created_at: number;
};

function toTrip(row: TripRow): Trip {
	return {
		id: row.id,
		userId: row.user_id,
		name: row.name,
		startDayKey: row.start_day_key as DayKey,
		endDayKey: row.end_day_key as DayKey,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function toDayMemory(row: MemoryRow): DayMemory {
	return {
		id: row.id,
		userId: row.user_id,
		dayKey: row.day_key as DayKey,
		uri: row.local_uri,
		imageWidth: row.image_width,
		imageHeight: row.image_height,
		dominantColor: row.dominant_color,
		remoteUrl: row.remote_url,
		syncStatus: row.sync_status,
		createdAt: row.created_at,
	};
}

function createId() {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function listTrips(userId: string): Promise<Trip[]> {
	const db = await getMemoriesDb();
	const rows = await db.getAllAsync<TripRow>(
		`SELECT id, user_id, name, start_day_key, end_day_key, created_at, updated_at
		FROM trips
		WHERE user_id = ?
		ORDER BY created_at DESC`,
		userId,
	);
	return rows.map(toTrip);
}

export async function createTrip(params: {
	userId: string;
	name: string;
	startDayKey: DayKey;
	endDayKey: DayKey;
	todayDayKey: DayKey;
	maxEndDayKey: DayKey;
}): Promise<Trip> {
	const { userId, name, startDayKey, endDayKey, todayDayKey, maxEndDayKey } =
		params;
	const trimmedName = name.trim();

	if (!trimmedName) {
		throw new Error("Trip name is required.");
	}
	if (trimmedName.length > 60) {
		throw new Error("Trip name must be 60 characters or fewer.");
	}
	if (compareDayKeys(startDayKey, todayDayKey) < 0) {
		throw new Error("Trip start date must be today or later.");
	}
	if (compareDayKeys(endDayKey, startDayKey) < 0) {
		throw new Error("Trip end date cannot be before the start date.");
	}
	if (compareDayKeys(endDayKey, maxEndDayKey) > 0) {
		throw new Error("Trip end date must be within two months from today.");
	}

	const now = Date.now();
	const trip: Trip = {
		id: createId(),
		userId,
		name: trimmedName,
		startDayKey,
		endDayKey,
		createdAt: now,
		updatedAt: now,
	};

	const db = await getMemoriesDb();
	await db.runAsync(
		`INSERT INTO trips (
			id, user_id, name, start_day_key, end_day_key, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		trip.id,
		trip.userId,
		trip.name,
		trip.startDayKey,
		trip.endDayKey,
		trip.createdAt,
		trip.updatedAt,
	);

	return trip;
}

export async function renameTrip(params: {
	userId: string;
	tripId: TripId;
	name: string;
}): Promise<Trip> {
	const { userId, tripId, name } = params;
	const trimmedName = name.trim();

	if (!trimmedName) {
		throw new Error("Trip name is required.");
	}
	if (trimmedName.length > 60) {
		throw new Error("Trip name must be 60 characters or fewer.");
	}

	const db = await getMemoriesDb();
	const existing = await db.getFirstAsync<TripRow>(
		`SELECT id, user_id, name, start_day_key, end_day_key, created_at, updated_at
		FROM trips
		WHERE id = ? AND user_id = ?
		LIMIT 1`,
		tripId,
		userId,
	);

	if (!existing) {
		throw new Error("Trip not found.");
	}

	const now = Date.now();
	await db.runAsync(
		`UPDATE trips
		SET name = ?, updated_at = ?
		WHERE id = ? AND user_id = ?`,
		trimmedName,
		now,
		tripId,
		userId,
	);

	return {
		...toTrip(existing),
		name: trimmedName,
		updatedAt: now,
	};
}

export async function updateTripDates(params: {
	userId: string;
	tripId: TripId;
	startDayKey: DayKey;
	endDayKey: DayKey;
}): Promise<Trip> {
	const { userId, tripId, startDayKey, endDayKey } = params;

	if (compareDayKeys(endDayKey, startDayKey) < 0) {
		throw new Error("Trip end date cannot be before the start date.");
	}

	const db = await getMemoriesDb();
	const existing = await db.getFirstAsync<TripRow>(
		`SELECT id, user_id, name, start_day_key, end_day_key, created_at, updated_at
		FROM trips
		WHERE id = ? AND user_id = ?
		LIMIT 1`,
		tripId,
		userId,
	);

	if (!existing) {
		throw new Error("Trip not found.");
	}

	const now = Date.now();
	await db.runAsync(
		`UPDATE trips
		SET start_day_key = ?, end_day_key = ?, updated_at = ?
		WHERE id = ? AND user_id = ?`,
		startDayKey,
		endDayKey,
		now,
		tripId,
		userId,
	);

	return {
		...toTrip(existing),
		startDayKey,
		endDayKey,
		updatedAt: now,
	};
}

export async function listMemoriesByDayRange(
	userId: string,
	startDayKey: DayKey,
	endDayKey: DayKey,
): Promise<Record<DayKey, DayMemory[]>> {
	const db = await getMemoriesDb();
	const rows = await db.getAllAsync<MemoryRow>(
		`SELECT id, user_id, day_key, local_uri, image_width, image_height, dominant_color, remote_url, sync_status, created_at
		FROM memories
		WHERE user_id = ? AND day_key >= ? AND day_key <= ?
		ORDER BY day_key ASC, created_at ASC`,
		userId,
		startDayKey,
		endDayKey,
	);

	return rows.reduce<Record<DayKey, DayMemory[]>>((acc, row) => {
		const memory = toDayMemory(row);
		if (!acc[memory.dayKey]) {
			acc[memory.dayKey] = [];
		}
		acc[memory.dayKey].push(memory);
		return acc;
	}, {});
}

export type TripPreviewImage = {
	tripId: TripId;
	uri: string;
	dominantColor: string | null;
};

const MAX_PREVIEW_IMAGES = 4;

export async function listTripPreviewImages(
	userId: string,
): Promise<Record<TripId, TripPreviewImage[]>> {
	const db = await getMemoriesDb();
	const rows = await db.getAllAsync<{
		trip_id: string;
		local_uri: string;
		dominant_color: string | null;
		rn: number;
	}>(
		`SELECT trip_id, local_uri, dominant_color, rn FROM (
			SELECT t.id AS trip_id, m.local_uri, m.dominant_color,
				ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY m.created_at DESC) AS rn
			FROM trips t
			JOIN memories m
				ON m.user_id = t.user_id
				AND m.day_key >= t.start_day_key
				AND m.day_key <= t.end_day_key
			WHERE t.user_id = ?
		) sub
		WHERE rn <= ?`,
		userId,
		MAX_PREVIEW_IMAGES,
	);

	return rows.reduce<Record<TripId, TripPreviewImage[]>>((acc, row) => {
		if (!acc[row.trip_id]) {
			acc[row.trip_id] = [];
		}
		acc[row.trip_id].push({
			tripId: row.trip_id,
			uri: row.local_uri,
			dominantColor: row.dominant_color,
		});
		return acc;
	}, {});
}

export async function listTripMemoryCounts(
	userId: string,
): Promise<Record<TripId, number>> {
	const db = await getMemoriesDb();
	const rows = await db.getAllAsync<{ trip_id: string; memory_count: number }>(
		`SELECT t.id as trip_id, COUNT(m.id) as memory_count
		FROM trips t
		LEFT JOIN memories m
			ON m.user_id = t.user_id
			AND m.day_key >= t.start_day_key
			AND m.day_key <= t.end_day_key
		WHERE t.user_id = ?
		GROUP BY t.id`,
		userId,
	);

	return rows.reduce<Record<TripId, number>>((acc, row) => {
		acc[row.trip_id] = Number(row.memory_count ?? 0);
		return acc;
	}, {});
}
