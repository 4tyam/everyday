import type { DayKey } from "../memories/types";

export type TripId = string;

export type Trip = {
	id: TripId;
	userId: string;
	name: string;
	startDayKey: DayKey;
	endDayKey: DayKey;
	createdAt: number;
	updatedAt: number;
};

export type TripStatus = "upcoming" | "ongoing" | "past";
