import { useCallback, useMemo, useState } from "react";
import type { DayKey, DayMemory, DayMemoryMap } from "./types";

function createMemory(uri: string): DayMemory {
	return {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
		uri,
		createdAt: Date.now(),
	};
}

export function useDayMemories() {
	const [memoriesByDay, setMemoriesByDay] = useState<DayMemoryMap>({});

	const getMemories = useCallback(
		(dayKey: DayKey): DayMemory[] => memoriesByDay[dayKey] ?? [],
		[memoriesByDay],
	);

	const addMemories = useCallback((dayKey: DayKey, uris: string[]) => {
		if (uris.length === 0) {
			return;
		}

		setMemoriesByDay((current) => {
			const existing = current[dayKey] ?? [];
			const next = [...existing, ...uris.map(createMemory)];
			return { ...current, [dayKey]: next };
		});
	}, []);

	const getDotCount = useCallback(
		(dayKey: DayKey): number => {
			const count = getMemories(dayKey).length;
			if (count <= 0) {
				return 0;
			}
			if (count === 1) {
				return 1;
			}
			if (count === 2) {
				return 2;
			}
			return 3;
		},
		[getMemories],
	);

	const totalMemories = useMemo(
		() => Object.values(memoriesByDay).reduce((sum, day) => sum + day.length, 0),
		[memoriesByDay],
	);

	return {
		addMemories,
		getDotCount,
		getMemories,
		memoriesByDay,
		totalMemories,
	};
}
