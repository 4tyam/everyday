import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addMonthsToDayKey, compareDayKeys } from "../memories/day-key";
import type { DayKey, DayMemory } from "../memories/types";
import {
	createTrip as createTripInRepo,
	listMemoriesByDayRange,
	listTripMemoryCounts,
	listTripPreviewImages,
	listTrips,
} from "./repository";
import type { TripPreviewImage } from "./repository";
import type { Trip, TripId, TripStatus } from "./types";

function tripsQueryKey(userId: string) {
	return ["trips", "list", userId] as const;
}

function tripCountsQueryKey(userId: string) {
	return ["trips", "counts", userId] as const;
}

function tripPreviewsQueryKey(userId: string) {
	return ["trips", "previews", userId] as const;
}

function tripMemoriesQueryKey(
	userId: string,
	startDayKey: DayKey,
	endDayKey: DayKey,
) {
	return ["trips", "memories", userId, startDayKey, endDayKey] as const;
}

function getTripStatus(trip: Trip, todayDayKey: DayKey): TripStatus {
	if (compareDayKeys(todayDayKey, trip.startDayKey) < 0) {
		return "upcoming";
	}
	if (compareDayKeys(todayDayKey, trip.endDayKey) > 0) {
		return "past";
	}
	return "ongoing";
}

function sortByStartAsc(a: Trip, b: Trip): number {
	const byStart = compareDayKeys(a.startDayKey, b.startDayKey);
	if (byStart !== 0) {
		return byStart;
	}
	return a.createdAt - b.createdAt;
}

function sortByStartDesc(a: Trip, b: Trip): number {
	return sortByStartAsc(b, a);
}

export function useTrips(params: { userId?: string | null; todayDayKey: DayKey }) {
	const { userId, todayDayKey } = params;
	const queryClient = useQueryClient();
	const isEnabled = Boolean(userId);
	const maxEndDayKey = addMonthsToDayKey(todayDayKey, 2);

	const tripsQuery = useQuery({
		queryKey: userId ? tripsQueryKey(userId) : ["trips", "list"],
		queryFn: () => listTrips(userId as string),
		enabled: isEnabled,
	});

	const tripCountsQuery = useQuery({
		queryKey: userId ? tripCountsQueryKey(userId) : ["trips", "counts"],
		queryFn: () => listTripMemoryCounts(userId as string),
		enabled: isEnabled,
	});

	const tripPreviewsQuery = useQuery({
		queryKey: userId ? tripPreviewsQueryKey(userId) : ["trips", "previews"],
		queryFn: () => listTripPreviewImages(userId as string),
		enabled: isEnabled,
	});

	const createTripMutation = useMutation({
		mutationFn: async (input: {
			name: string;
			startDayKey: DayKey;
			endDayKey: DayKey;
		}) => {
			if (!userId) {
				throw new Error("You need to be signed in to create a trip.");
			}
			return createTripInRepo({
				userId,
				name: input.name,
				startDayKey: input.startDayKey,
				endDayKey: input.endDayKey,
				todayDayKey,
				maxEndDayKey,
			});
		},
		onSuccess: (createdTrip) => {
			if (!userId) {
				return;
			}
			queryClient.setQueryData<Trip[]>(
				tripsQueryKey(userId),
				(current = []): Trip[] => [createdTrip, ...current],
			);
			void queryClient.invalidateQueries({
				queryKey: tripCountsQueryKey(userId),
			});
			void queryClient.invalidateQueries({
				queryKey: tripPreviewsQueryKey(userId),
			});
		},
	});

	const trips = tripsQuery.data ?? [];

	const groupedTrips = useMemo(() => {
		const upcoming: Trip[] = [];
		const ongoing: Trip[] = [];
		const past: Trip[] = [];

		for (const trip of trips) {
			const status = getTripStatus(trip, todayDayKey);
			if (status === "upcoming") {
				upcoming.push(trip);
			} else if (status === "ongoing") {
				ongoing.push(trip);
			} else {
				past.push(trip);
			}
		}

		upcoming.sort(sortByStartAsc);
		ongoing.sort(sortByStartAsc);
		past.sort(sortByStartDesc);

		return { upcoming, ongoing, past };
	}, [todayDayKey, trips]);

	return {
		trips,
		groupedTrips,
		memoryCountsByTripId: tripCountsQuery.data ?? ({} as Record<TripId, number>),
		previewsByTripId: tripPreviewsQuery.data ?? ({} as Record<TripId, TripPreviewImage[]>),
		createTrip: createTripMutation.mutateAsync,
		createTripError: createTripMutation.error,
		isCreating: createTripMutation.isPending,
		isLoading: tripsQuery.isLoading || tripCountsQuery.isLoading,
		maxEndDayKey,
	};
}

export function useTripMemories(params: {
	userId?: string | null;
	startDayKey: DayKey;
	endDayKey: DayKey;
}) {
	const { userId, startDayKey, endDayKey } = params;
	const isEnabled = Boolean(userId);

	const memoriesQuery = useQuery({
		queryKey: userId
			? tripMemoriesQueryKey(userId, startDayKey, endDayKey)
			: ["trips", "memories"],
		queryFn: () =>
			listMemoriesByDayRange(userId as string, startDayKey, endDayKey),
		enabled: isEnabled,
	});

	const memoriesByDay = memoriesQuery.data ?? {};
	const memories = useMemo(
		() =>
			Object.values(memoriesByDay).reduce<DayMemory[]>(
				(all, dayMemories) => all.concat(dayMemories),
				[],
			),
		[memoriesByDay],
	);

	return {
		memoriesByDay,
		memories,
		totalMemories: memories.length,
		isLoading: memoriesQuery.isLoading,
	};
}
