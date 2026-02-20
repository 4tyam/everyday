import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function setupSchema(db: SQLite.SQLiteDatabase) {
	await db.execAsync(`
		PRAGMA journal_mode = WAL;
		CREATE TABLE IF NOT EXISTS memories (
			id TEXT PRIMARY KEY NOT NULL,
			user_id TEXT NOT NULL,
			day_key TEXT NOT NULL,
			local_uri TEXT NOT NULL,
			image_width INTEGER,
			image_height INTEGER,
			dominant_color TEXT,
			remote_url TEXT,
			sync_status TEXT NOT NULL DEFAULT 'local_only',
			retry_count INTEGER NOT NULL DEFAULT 0,
			last_error TEXT,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_memories_user_day ON memories (user_id, day_key);
		CREATE INDEX IF NOT EXISTS idx_memories_user_created ON memories (user_id, created_at);

		CREATE TABLE IF NOT EXISTS memory_sync_queue (
			id TEXT PRIMARY KEY NOT NULL,
			memory_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			operation TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending',
			attempts INTEGER NOT NULL DEFAULT 0,
			next_retry_at INTEGER,
			last_error TEXT,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_sync_queue_user_status
			ON memory_sync_queue (user_id, status, next_retry_at);
	`);

	// Forward-compatible local migration for users who already created the DB.
	try {
		await db.runAsync("ALTER TABLE memories ADD COLUMN image_width INTEGER");
	} catch {
		// Column likely already exists.
	}
	try {
		await db.runAsync("ALTER TABLE memories ADD COLUMN image_height INTEGER");
	} catch {
		// Column likely already exists.
	}
	try {
		await db.runAsync("ALTER TABLE memories ADD COLUMN dominant_color TEXT");
	} catch {
		// Column likely already exists.
	}
}

export async function getMemoriesDb() {
	if (!dbPromise) {
		dbPromise = SQLite.openDatabaseAsync("everyday-memories.db").then(
			async (db: any) => {
				await setupSchema(db);
				return db;
			},
		);
	}

	return dbPromise;
}

export async function initializeMemoriesDb() {
	await getMemoriesDb();
}
