import { getMemoriesDb } from "./local-db";
import { resolveDominantColor } from "./dominant-color";
import { persistMemoryImage } from "./local-files";
import type { DayKey, DayMemory } from "./types";

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

async function enqueueUpload(
	memoryId: string,
	userId: string,
	createdAt: number,
) {
	const db = await getMemoriesDb();
	await db.runAsync(
		`INSERT INTO memory_sync_queue (
			id, memory_id, user_id, operation, status, attempts, created_at, updated_at
		) VALUES (?, ?, ?, 'upload', 'pending', 0, ?, ?)`,
		createId(),
		memoryId,
		userId,
		createdAt,
		createdAt,
	);
}

export async function listMemoriesByDay(userId: string, dayKey: DayKey) {
	const db = await getMemoriesDb();
	const rows = await db.getAllAsync<MemoryRow>(
		`SELECT id, user_id, day_key, local_uri, image_width, image_height, dominant_color, remote_url, sync_status, created_at
		FROM memories
		WHERE user_id = ? AND day_key = ?
		ORDER BY created_at ASC`,
		userId,
		dayKey,
	);
	return rows.map(toDayMemory);
}

export async function listMemoriesByMonth(userId: string, monthKey: string) {
	const db = await getMemoriesDb();
	const rows = await db.getAllAsync<MemoryRow>(
		`SELECT id, user_id, day_key, local_uri, image_width, image_height, dominant_color, remote_url, sync_status, created_at
		FROM memories
		WHERE user_id = ? AND day_key LIKE ?
		ORDER BY created_at ASC`,
		userId,
		`${monthKey}-%`,
	);

	return rows.reduce<Record<DayKey, DayMemory[]>>(
		(map: Record<DayKey, DayMemory[]>, row: MemoryRow) => {
			const memory = toDayMemory(row);
			const dayKey = memory.dayKey;
			if (!map[dayKey]) {
				map[dayKey] = [];
			}
			map[dayKey].push(memory);
			return map;
		},
		{},
	);
}

export async function addMemoryUris(params: {
	userId: string;
	dayKey: DayKey;
	sourceAssets: Array<{
		uri: string;
		width: number | null;
		height: number | null;
	}>;
}) {
	const { userId, dayKey, sourceAssets } = params;
	if (sourceAssets.length === 0) {
		return [] as DayMemory[];
	}

	const db = await getMemoriesDb();
	const now = Date.now();
	const created: DayMemory[] = [];

	for (const sourceAsset of sourceAssets) {
		const memoryId = createId();
		const localUri = await persistMemoryImage({
			sourceUri: sourceAsset.uri,
			userId,
			dayKey,
			memoryId,
		});
		const dominantColor = await resolveDominantColor(localUri);

		await db.runAsync(
			`INSERT INTO memories (
				id, user_id, day_key, local_uri, image_width, image_height, dominant_color, remote_url, sync_status, retry_count, last_error, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'pending', 0, NULL, ?, ?)`,
			memoryId,
			userId,
			dayKey,
			localUri,
			sourceAsset.width,
			sourceAsset.height,
			dominantColor,
			now,
			now,
		);

		await enqueueUpload(memoryId, userId, now);

		created.push({
			id: memoryId,
			userId,
			dayKey,
			uri: localUri,
			imageWidth: sourceAsset.width,
			imageHeight: sourceAsset.height,
			dominantColor,
			remoteUrl: null,
			syncStatus: "pending",
			createdAt: now,
		});
	}

	return created;
}
