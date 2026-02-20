export type DayKey = `${number}-${string}-${string}`;

export type DayMemory = {
	id: string;
	uri: string;
	createdAt: number;
};

export type DayMemoryMap = Record<DayKey, DayMemory[]>;
