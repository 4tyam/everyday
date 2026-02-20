import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	addMemoryUris,
	deleteMemoryById,
	listMemoriesByDay,
	listMemoriesByMonth,
} from "./repository";
import type { CapturedMemoryAsset } from "./capture-memory-images";
import type { DayKey, DayMemory, DayMemoryMap } from "./types";

type UseDayMemoriesParams = {
	userId?: string | null;
	visibleMonthKey: string;
	todayDayKey: DayKey;
	previousDayKey: DayKey;
};

function monthQueryKey(userId: string, monthKey: string) {
	return ["memories", "month", userId, monthKey] as const;
}

function dayQueryKey(userId: string, dayKey: DayKey) {
	return ["memories", "day", userId, dayKey] as const;
}

function getMonthFromDayKey(dayKey: DayKey) {
	return dayKey.slice(0, 7);
}

function upsertDayInMap(
	current: DayMemoryMap | undefined,
	dayKey: DayKey,
	dayMemories: DayMemory[],
): DayMemoryMap {
	return {
		...(current ?? {}),
		[dayKey]: dayMemories,
	};
}

export function useDayMemories({
	userId,
	visibleMonthKey,
	todayDayKey,
	previousDayKey,
}: UseDayMemoriesParams) {
	const queryClient = useQueryClient();
	const isEnabled = Boolean(userId);

	const monthMemoriesQuery = useQuery({
		queryKey: userId
			? monthQueryKey(userId, visibleMonthKey)
			: ["memories", "month"],
		queryFn: () => listMemoriesByMonth(userId as string, visibleMonthKey),
		enabled: isEnabled,
	});

	const todayMemoriesQuery = useQuery({
		queryKey: userId
			? dayQueryKey(userId, todayDayKey)
			: ["memories", "day", "today"],
		queryFn: () => listMemoriesByDay(userId as string, todayDayKey),
		enabled: isEnabled,
	});

	const previousMemoriesQuery = useQuery({
		queryKey: userId
			? dayQueryKey(userId, previousDayKey)
			: ["memories", "day", "previous"],
		queryFn: () => listMemoriesByDay(userId as string, previousDayKey),
		enabled: isEnabled,
	});

	const memoriesByDay = useMemo(() => {
		const map: DayMemoryMap = {
			...(monthMemoriesQuery.data ?? {}),
		};

		if (todayMemoriesQuery.data) {
			map[todayDayKey] = todayMemoriesQuery.data;
		}
		if (previousMemoriesQuery.data) {
			map[previousDayKey] = previousMemoriesQuery.data;
		}

		return map;
	}, [
		monthMemoriesQuery.data,
		previousDayKey,
		previousMemoriesQuery.data,
		todayDayKey,
		todayMemoriesQuery.data,
	]);

	const addMutation = useMutation({
		mutationFn: async (params: {
			dayKey: DayKey;
			assets: CapturedMemoryAsset[];
		}) => {
			if (!userId) {
				return [] as DayMemory[];
			}
			return addMemoryUris({
				userId,
				dayKey: params.dayKey,
				sourceAssets: params.assets,
			});
		},
		onSuccess: (
			addedMemories: DayMemory[],
			vars: { dayKey: DayKey; assets: CapturedMemoryAsset[] },
		) => {
			if (!userId || addedMemories.length === 0) {
				return;
			}

			queryClient.setQueryData<DayMemory[]>(
				dayQueryKey(userId, vars.dayKey),
				(current: DayMemory[] | undefined) => [
					...(current ?? []),
					...addedMemories,
				],
			);

			const monthKey = getMonthFromDayKey(vars.dayKey);
			queryClient.setQueryData<DayMemoryMap>(
				monthQueryKey(userId, monthKey),
				(current: DayMemoryMap | undefined) => {
					const existingDay = current?.[vars.dayKey] ?? [];
					return upsertDayInMap(current, vars.dayKey, [
						...existingDay,
						...addedMemories,
					]);
				},
			);
			void queryClient.invalidateQueries({
				queryKey: ["trips", "memories", userId],
			});
			void queryClient.invalidateQueries({
				queryKey: ["trips", "counts", userId],
			});
			void queryClient.invalidateQueries({
				queryKey: ["trips", "previews", userId],
			});
		},
	});

	const removeMutation = useMutation({
		mutationFn: async (params: { dayKey: DayKey; memoryId: string }) => {
			if (!userId) {
				return null;
			}
			return deleteMemoryById({ userId, memoryId: params.memoryId });
		},
		onSuccess: (
			result: { dayKey: DayKey; memoryId: string } | null,
			vars: { dayKey: DayKey; memoryId: string },
		) => {
			if (!userId || !result) {
				return;
			}

			queryClient.setQueryData<DayMemory[]>(
				dayQueryKey(userId, vars.dayKey),
				(current: DayMemory[] | undefined) =>
					(current ?? []).filter((memory) => memory.id !== vars.memoryId),
			);

			const monthKey = getMonthFromDayKey(vars.dayKey);
			queryClient.setQueryData<DayMemoryMap>(
				monthQueryKey(userId, monthKey),
				(current: DayMemoryMap | undefined) => {
					if (!current) {
						return current;
					}
					const existingDay = current[vars.dayKey] ?? [];
					return upsertDayInMap(
						current,
						vars.dayKey,
						existingDay.filter((memory) => memory.id !== vars.memoryId),
					);
				},
			);
			void queryClient.invalidateQueries({
				queryKey: ["trips", "memories", userId],
			});
			void queryClient.invalidateQueries({
				queryKey: ["trips", "counts", userId],
			});
			void queryClient.invalidateQueries({
				queryKey: ["trips", "previews", userId],
			});
		},
	});

	const getMemories = useCallback(
		(dayKey: DayKey): DayMemory[] => memoriesByDay[dayKey] ?? [],
		[memoriesByDay],
	);

	const addMemories = useCallback(
		(dayKey: DayKey, assets: CapturedMemoryAsset[]) => {
			if (!userId || assets.length === 0) {
				return;
			}
			addMutation.mutate({ dayKey, assets });
		},
		[addMutation, userId],
	);

	const removeMemory = useCallback(
		(dayKey: DayKey, memoryId: string) => {
			if (!userId || !memoryId) {
				return;
			}
			removeMutation.mutate({ dayKey, memoryId });
		},
		[removeMutation, userId],
	);

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
		() =>
			Object.values(memoriesByDay).reduce((sum, day) => sum + day.length, 0),
		[memoriesByDay],
	);

	return {
		addMemories,
		removeMemory,
		getDotCount,
		getMemories,
		memoriesByDay,
		totalMemories,
		isLoading:
			monthMemoriesQuery.isLoading ||
			todayMemoriesQuery.isLoading ||
			previousMemoriesQuery.isLoading,
	};
}
