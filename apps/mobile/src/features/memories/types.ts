export type DayKey = `${number}-${string}-${string}`;

export type DayMemory = {
	id: string;
	uri: string;
	dayKey: DayKey;
	userId: string;
	syncStatus: "local_only" | "pending" | "syncing" | "synced" | "failed";
	remoteUrl: string | null;
	imageWidth: number | null;
	imageHeight: number | null;
	dominantColor: string | null;
	createdAt: number;
};

export type DayMemoryMap = Record<DayKey, DayMemory[]>;
