import { useEffect, useMemo, useRef, useState } from "react";
import {
	Animated,
	Easing,
	PanResponder,
	Pressable,
	ScrollView,
	Text,
	useColorScheme,
	View,
} from "react-native";
import ArrowLeftIcon from "../assets/icons/arrowLeft.svg";
import CalendarIcon from "../assets/icons/calendar.svg";
import CalendarToIcon from "../assets/icons/calendar2.svg";
import { DayCell } from "./calendar/day-cell";
import { SelectedDayMemories } from "./calendar/selected-day-memories";
import { useAuth } from "../context/auth-context";
import { captureMemoryImages } from "../features/memories/capture-memory-images";
import {
	startOfLocalDay,
	toDayKey,
	toLocalDayKey,
	toMonthKey,
} from "../features/memories/day-key";
import type { DayKey } from "../features/memories/types";
import { useDayMemories } from "../features/memories/use-day-memories";
import { getTheme } from "../theme/colors";

const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const monthNames = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

const weekDayLetters = ["M", "T", "W", "T", "F", "S", "S"];
const monthWeekRowHeight = 56;
const memoryDotPalette = [
	"#ef4444", // red
	"#f97316", // orange
	"#eab308", // yellow
	"#22c55e", // green
	"#23a6ff", // blue
	"#6366f1", // indigo
	"#8b5cf6", // violet
	"#FF00FF", // pink
];

function parseMonthKey(monthKey: string): { year: number; month: number } {
	const [yearRaw, monthRaw] = monthKey.split("-");
	return { year: Number(yearRaw), month: Number(monthRaw) };
}

function monthTitle(monthKey: string): string {
	const date = new Date(`${monthKey}-01T00:00:00`);
	return new Intl.DateTimeFormat("en-US", {
		month: "long",
	}).format(date);
}

function currentMonthKey(): string {
	const now = new Date();
	return toMonthKey(now.getFullYear(), now.getMonth() + 1);
}

function shiftMonth(monthKey: string, delta: number): string {
	const { year, month } = parseMonthKey(monthKey);
	const next = new Date(year, month - 1 + delta, 1);
	return toMonthKey(next.getFullYear(), next.getMonth() + 1);
}

function compareMonthKeys(a: string, b: string): number {
	const first = parseMonthKey(a);
	const second = parseMonthKey(b);
	if (first.year !== second.year) {
		return first.year - second.year;
	}
	return first.month - second.month;
}

function maxMonthKey(a: string, b: string): string {
	return compareMonthKeys(a, b) >= 0 ? a : b;
}

function minMonthKey(a: string, b: string): string {
	return compareMonthKeys(a, b) <= 0 ? a : b;
}

function clampMonthKey(
	value: string,
	minimum: string,
	maximum: string,
): string {
	return minMonthKey(maxMonthKey(value, minimum), maximum);
}

function parseDateValue(value: unknown): Date | null {
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}

	if (typeof value === "string" || typeof value === "number") {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}

	return null;
}

function extractCreatedAt(value: unknown): Date | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const record = value as Record<string, unknown>;
	return parseDateValue(record.createdAt) ?? parseDateValue(record.created_at);
}

function buildMonthWeeks(
	year: number,
	month: number,
): Array<Array<number | null>> {
	const firstDay = new Date(year, month - 1, 1);
	const daysInMonth = new Date(year, month, 0).getDate();
	const mondayIndex = (firstDay.getDay() + 6) % 7;
	const cells: Array<number | null> = [...Array(mondayIndex).fill(null)];

	for (let day = 1; day <= daysInMonth; day += 1) {
		cells.push(day);
	}

	while (cells.length % 7 !== 0) {
		cells.push(null);
	}

	const weeks: Array<Array<number | null>> = [];
	for (let index = 0; index < cells.length; index += 7) {
		weeks.push(cells.slice(index, index + 7));
	}
	return weeks;
}

function formatMemoryHeaderDateLabel(
	targetDate: Date,
	todayDate: Date,
): string {
	const targetStart = startOfLocalDay(targetDate);
	const todayStart = startOfLocalDay(todayDate);
	const dayDiff = Math.round(
		(todayStart.getTime() - targetStart.getTime()) / (24 * 60 * 60 * 1000),
	);

	if (dayDiff === 0) {
		return "Today";
	}

	if (dayDiff === 1) {
		return "Yesterday";
	}

	// Treat Monday as first day of week.
	const mondayIndex = (todayStart.getDay() + 6) % 7;
	const weekStart = new Date(todayStart);
	weekStart.setDate(todayStart.getDate() - mondayIndex);
	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekStart.getDate() + 6);

	if (targetStart >= weekStart && targetStart <= weekEnd) {
		return targetDate.toLocaleDateString("en-US", { weekday: "long" });
	}

	if (targetDate.getFullYear() === todayDate.getFullYear()) {
		return targetDate.toLocaleDateString("en-US", {
			month: "long",
			day: "numeric",
		});
	}

	return targetDate.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

export function ImageCalendar() {
	const { user, session } = useAuth();
	const [now, setNow] = useState(() => new Date());
	const userCreatedMonth = useMemo(() => {
		const createdAt =
			extractCreatedAt(user) ??
			extractCreatedAt((session as { user?: unknown } | null)?.user) ??
			extractCreatedAt(session);

		if (!createdAt) {
			return null;
		}

		return toMonthKey(createdAt.getFullYear(), createdAt.getMonth() + 1);
	}, [session, user]);
	const maximumMonth = currentMonthKey();
	const minimumMonth = userCreatedMonth
		? minMonthKey(userCreatedMonth, maximumMonth)
		: maximumMonth;
	const focusMonthKey = clampMonthKey(
		currentMonthKey(),
		minimumMonth,
		maximumMonth,
	);
	const [visibleMonth, setVisibleMonth] = useState(currentMonthKey);
	const [isYearOverviewOpen, setIsYearOverviewOpen] = useState(false);
	const [transitionDirection, setTransitionDirection] = useState<0 | 1 | -1>(0);
	const [selectedDay, setSelectedDay] = useState<number | null>(null);
	const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(
		null,
	);
	const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
	const colorScheme = useColorScheme();
	const theme = getTheme(colorScheme);
	const todayDate = now;
	const todayKey = toLocalDayKey(todayDate);
	const todayYear = todayDate.getFullYear();
	const todayMonth = todayDate.getMonth() + 1;
	const todayDay = todayDate.getDate();
	const previousDate = useMemo(() => {
		const previous = new Date(todayDate);
		previous.setDate(previous.getDate() - 1);
		return previous;
	}, [todayDate]);
	const previousDayKey = toLocalDayKey(previousDate);
	const isPreviousDayUploadEnabled = todayDate.getHours() < 5;
	const actionBlue = "#0a84ff";
	const filledBlueBackground = colorScheme === "dark" ? "#16324d" : "#dcecff";
	const todayCircleColor = actionBlue;
	const selectedDayBackgroundColor = filledBlueBackground;
	const calendarIconColor =
		colorScheme === "dark" ? "#ffffff" : theme.textPrimary;
	const { addMemories, getMemories, memoriesByDay, removeMemory } = useDayMemories({
		userId: user?.id ?? null,
		visibleMonthKey: visibleMonth,
		todayDayKey: todayKey,
		previousDayKey,
	});
	const { year: visibleYear, month: visibleMonthNumber } =
		parseMonthKey(visibleMonth);
	const { year: minimumYear, month: minimumMonthNumber } =
		parseMonthKey(minimumMonth);
	const { year: maximumYear, month: maximumMonthNumber } =
		parseMonthKey(maximumMonth);
	const transitionProgress = useRef(new Animated.Value(1)).current;
	const selectedWeekOffset = useRef(new Animated.Value(0)).current;
	const selectedContentProgress = useRef(new Animated.Value(0)).current;
	const headerResetProgress = useRef(new Animated.Value(0)).current;
	const monthGridHeight = useRef(
		new Animated.Value(monthWeekRowHeight * 5),
	).current;
	const skipNextMonthAnimationRef = useRef(false);
	const pendingSelectedDayAfterMonthChangeRef = useRef<{
		day: number;
		weekIndex: number;
	} | null>(null);
	const overviewScrollRef = useRef<ScrollView | null>(null);
	const monthOffsetsRef = useRef<Record<string, number>>({});
	const yearOffsetsRef = useRef<Record<number, number>>({});
	const pendingFocusMonthKeyRef = useRef<string | null>(null);
	const yearRange = useMemo(
		() =>
			Array.from(
				{ length: maximumYear - minimumYear + 1 },
				(_, index) => minimumYear + index,
			),
		[maximumYear, minimumYear],
	);

	useEffect(() => {
		const interval = setInterval(() => {
			setNow(new Date());
		}, 60_000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		setVisibleMonth((current) =>
			clampMonthKey(current, minimumMonth, maximumMonth),
		);
	}, [minimumMonth, maximumMonth]);

	useEffect(() => {
		if (skipNextMonthAnimationRef.current) {
			skipNextMonthAnimationRef.current = false;
			transitionProgress.setValue(1);
			setTransitionDirection(0);
			return;
		}

		transitionProgress.setValue(0);
		Animated.timing(transitionProgress, {
			toValue: 1,
			duration: 260,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: true,
		}).start(() => {
			setTransitionDirection(0);
		});
	}, [transitionProgress, visibleMonth]);

	useEffect(() => {
		const { year, month } = parseMonthKey(visibleMonth);
		const monthGridRows = buildMonthWeeks(year, month).length;
		const pendingSelection = pendingSelectedDayAfterMonthChangeRef.current;
		if (pendingSelection) {
			const nextWeekOffset = -pendingSelection.weekIndex * monthWeekRowHeight;
			setSelectedDay(pendingSelection.day);
			setSelectedWeekIndex(pendingSelection.weekIndex);
			selectedWeekOffset.setValue(nextWeekOffset);
			selectedContentProgress.setValue(1);
			headerResetProgress.setValue(1);
			monthGridHeight.setValue(monthWeekRowHeight);
			pendingSelectedDayAfterMonthChangeRef.current = null;
			return;
		}
		setSelectedDay(null);
		setSelectedWeekIndex(null);
		selectedWeekOffset.setValue(0);
		selectedContentProgress.setValue(0);
		headerResetProgress.setValue(0);
		monthGridHeight.setValue(monthGridRows * monthWeekRowHeight);
	}, [
		headerResetProgress,
		monthGridHeight,
		selectedContentProgress,
		selectedWeekOffset,
		visibleMonth,
	]);

	const navigateSelectedDayBy = (delta: 1 | -1) => {
		if (!selectedDay || selectedWeekIndex === null) {
			return;
		}

		const activeWeek = visibleMonthWeeks[selectedWeekIndex];
		if (!activeWeek) {
			return;
		}
		const currentDayIndex = activeWeek.findIndex((day) => day === selectedDay);
		if (currentDayIndex < 0) {
			return;
		}

		let targetDay: number | null = null;
		for (
			let index = currentDayIndex + delta;
			index >= 0 && index < activeWeek.length;
			index += delta
		) {
			const candidateDay = activeWeek[index];
			if (!candidateDay) {
				continue;
			}
			const candidateDayKey = toDayKey(visibleMonth, candidateDay);
			const isCandidateToday = candidateDayKey === todayKey;
			const candidateHasMemories = getMemories(candidateDayKey).length > 0;
			const canOpenCandidate = isCandidateToday || candidateHasMemories;
			if (canOpenCandidate) {
				targetDay = candidateDay;
				break;
			}
		}

		if (!targetDay) {
			return;
		}

		setSelectedDay(targetDay);
		Animated.timing(selectedContentProgress, {
			toValue: 1,
			duration: 180,
			easing: Easing.out(Easing.quad),
			useNativeDriver: true,
		}).start();
	};

	const applyMonthChange = (nextMonth: string, direction: 1 | -1 | 0) => {
		if (
			compareMonthKeys(nextMonth, minimumMonth) < 0 ||
			compareMonthKeys(nextMonth, maximumMonth) > 0
		) {
			return;
		}
		setTransitionDirection(direction);
		setVisibleMonth(nextMonth);
	};

	const changeMonthBy = (delta: number) => {
		applyMonthChange(shiftMonth(visibleMonth, delta), delta > 0 ? 1 : -1);
	};

	const panResponder = useMemo(
		() =>
			PanResponder.create({
				onMoveShouldSetPanResponder: (_, gestureState) =>
					!isImageViewerOpen &&
					Math.abs(gestureState.dx) > 12 &&
					Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
				onPanResponderRelease: (_, gestureState) => {
					if (gestureState.dx < -40) {
						if (selectedDay) {
							navigateSelectedDayBy(1);
							return;
						}
						// Left swipe -> next month.
						changeMonthBy(1);
						return;
					}

					if (gestureState.dx > 40) {
						if (selectedDay) {
							navigateSelectedDayBy(-1);
							return;
						}
						// Right swipe -> previous month.
						changeMonthBy(-1);
					}
				},
			}),
		[isImageViewerOpen, selectedDay, maximumMonth, minimumMonth, visibleMonth],
	);

	const onOpenYearOverview = () => {
		if (isYearOverviewOpen) {
			return;
		}
		pendingFocusMonthKeyRef.current = focusMonthKey;
		setIsYearOverviewOpen(true);
	};

	const tryFocusOverviewMonth = (monthKey: string, animated: boolean) => {
		const y = monthOffsetsRef.current[monthKey];
		if (y === undefined || !overviewScrollRef.current) {
			return false;
		}
		overviewScrollRef.current.scrollTo({
			y: Math.max(0, y - 24),
			animated,
		});
		return true;
	};

	useEffect(() => {
		if (!isYearOverviewOpen) {
			return;
		}

		const focusKey = pendingFocusMonthKeyRef.current ?? focusMonthKey;
		const hasFocusedNow = tryFocusOverviewMonth(focusKey, false);
		if (hasFocusedNow) {
			pendingFocusMonthKeyRef.current = null;
			return;
		}

		const timer = setTimeout(() => {
			if (tryFocusOverviewMonth(focusKey, false)) {
				pendingFocusMonthKeyRef.current = null;
			}
		}, 60);

		return () => clearTimeout(timer);
	}, [focusMonthKey, isYearOverviewOpen]);

	const onJumpToCurrentMonth = () => {
		const current = currentMonthKey();
		const clampedCurrent = clampMonthKey(current, minimumMonth, maximumMonth);
		const currentDate = new Date(
			visibleYear,
			visibleMonthNumber - 1,
			1,
		).getTime();
		const nextDate = new Date(`${clampedCurrent}-01T00:00:00`).getTime();
		const direction =
			nextDate > currentDate ? 1 : nextDate < currentDate ? -1 : 0;
		skipNextMonthAnimationRef.current = true;
		applyMonthChange(clampedCurrent, direction);
		setIsYearOverviewOpen(false);
	};

	const onSelectOverviewMonth = (year: number, month: number) => {
		if (
			(year === minimumYear && month < minimumMonthNumber) ||
			(year === maximumYear && month > maximumMonthNumber)
		) {
			return;
		}
		const currentDate = new Date(
			visibleYear,
			visibleMonthNumber - 1,
			1,
		).getTime();
		const nextDate = new Date(year, month - 1, 1).getTime();
		const direction =
			nextDate > currentDate ? 1 : nextDate < currentDate ? -1 : 0;
		skipNextMonthAnimationRef.current = true;
		applyMonthChange(toMonthKey(year, month), direction);
		setIsYearOverviewOpen(false);
	};

	const visibleMonthWeeks = useMemo(() => {
		const { year, month } = parseMonthKey(visibleMonth);
		return buildMonthWeeks(year, month);
	}, [visibleMonth]);
	const visibleMonthGridHeight = visibleMonthWeeks.length * monthWeekRowHeight;
	const currentDayKey = todayKey as DayKey;
	const selectedDayKey = useMemo(() => {
		if (!selectedDay) {
			return null;
		}
		return toDayKey(visibleMonth, selectedDay);
	}, [selectedDay, visibleMonth]);
	const currentDayMemories = useMemo(
		() => getMemories(currentDayKey),
		[currentDayKey, getMemories],
	);
	const previousDayMemories = useMemo(
		() => getMemories(previousDayKey),
		[previousDayKey, getMemories],
	);
	const selectedDayMemories = useMemo(() => {
		if (!selectedDayKey) {
			return [];
		}
		return getMemories(selectedDayKey);
	}, [getMemories, selectedDayKey]);
	const dotColorsByDay = useMemo(() => {
		const dayKeys = Object.keys(memoriesByDay).sort() as DayKey[];
		const result: Partial<Record<DayKey, string[]>> = {};
		let paletteCursor = 0;

		for (const dayKey of dayKeys) {
			const dayMemories = memoriesByDay[dayKey] ?? [];
			const visibleDotCount = Math.min(dayMemories.length, 3);
			const dayColors: string[] = [];

			for (let index = 0; index < visibleDotCount; index += 1) {
				dayColors.push(memoryDotPalette[paletteCursor % memoryDotPalette.length]);
				paletteCursor += 1;
			}

			if (dayColors.length > 0) {
				result[dayKey] = dayColors;
			}
		}

		return result;
	}, [memoriesByDay]);
	const isSelectedDayToday = selectedDayKey === todayKey;
	const isSelectedDayPrevious = selectedDayKey === previousDayKey;
	const selectedDate = useMemo(() => {
		if (!selectedDay) {
			return null;
		}
		const { year, month } = parseMonthKey(visibleMonth);
		return new Date(year, month - 1, selectedDay);
	}, [selectedDay, visibleMonth]);

	const todayWeekIndexInVisibleMonth = useMemo(() => {
		if (visibleYear !== todayYear || visibleMonthNumber !== todayMonth) {
			return null;
		}
		const index = visibleMonthWeeks.findIndex((week) =>
			week.includes(todayDay),
		);
		return index >= 0 ? index : null;
	}, [
		todayDay,
		todayMonth,
		todayYear,
		visibleMonthNumber,
		visibleMonthWeeks,
		visibleYear,
	]);

	const onDayPress = (day: number, weekIndex: number) => {
		setSelectedDay(day);
		setSelectedWeekIndex(weekIndex);
		Animated.parallel([
			Animated.timing(selectedWeekOffset, {
				toValue: -weekIndex * monthWeekRowHeight,
				duration: 300,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: true,
			}),
			Animated.timing(monthGridHeight, {
				toValue: monthWeekRowHeight,
				duration: 280,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: false,
			}),
			Animated.timing(selectedContentProgress, {
				toValue: 1,
				duration: 260,
				easing: Easing.out(Easing.quad),
				useNativeDriver: true,
			}),
			Animated.timing(headerResetProgress, {
				toValue: 1,
				duration: 240,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: false,
			}),
		]).start();
	};

	const onResetSelectedDay = () => {
		Animated.parallel([
			Animated.timing(selectedWeekOffset, {
				toValue: 0,
				duration: 240,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: true,
			}),
			Animated.timing(monthGridHeight, {
				toValue: visibleMonthGridHeight,
				duration: 240,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: false,
			}),
			Animated.timing(selectedContentProgress, {
				toValue: 0,
				duration: 180,
				easing: Easing.out(Easing.quad),
				useNativeDriver: true,
			}),
			Animated.timing(headerResetProgress, {
				toValue: 0,
				duration: 220,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: false,
			}),
		]).start(() => {
			setSelectedDay(null);
			setSelectedWeekIndex(null);
			selectedWeekOffset.setValue(0);
			monthGridHeight.setValue(visibleMonthGridHeight);
			selectedContentProgress.setValue(0);
			headerResetProgress.setValue(0);
		});
	};

	const onCollapseToWeekView = () => {
		if (
			selectedDay ||
			isYearOverviewOpen ||
			todayWeekIndexInVisibleMonth === null
		) {
			return;
		}
		onDayPress(todayDay, todayWeekIndexInVisibleMonth);
	};

	const onExpandToMonthView = () => {
		if (!selectedDay) {
			return;
		}
		onResetSelectedDay();
	};

	const onAddMemoryPressForDay = async (dayKey: DayKey) => {
		const imageAssets = await captureMemoryImages();
		if (imageAssets.length === 0) {
			return;
		}
		addMemories(dayKey, imageAssets);
	};

	const onAddTodayMemoryPress = () => {
		void onAddMemoryPressForDay(currentDayKey);
	};
	const onAddPreviousDayMemoryPress = () => {
		void onAddMemoryPressForDay(previousDayKey);
	};
	const onDeleteMemoryPress = (dayKey: DayKey, memoryId: string) => {
		removeMemory(dayKey, memoryId);
	};
	const shouldShowMemoriesPanel =
		selectedDay !== null ||
		(visibleYear === todayYear &&
			visibleMonthNumber === todayMonth &&
			currentDayMemories.length > 0);
	const activeMemories = selectedDay ? selectedDayMemories : currentDayMemories;
	const activeDateLabel =
		selectedDay && selectedDate
			? formatMemoryHeaderDateLabel(selectedDate, todayDate)
			: "Today";
	const isViewingCurrentMonth =
		visibleYear === todayYear && visibleMonthNumber === todayMonth;
	const canAddToPreviousDay =
		isPreviousDayUploadEnabled && previousDayMemories.length > 0;
	const activeCanAddMemory = selectedDay
		? isSelectedDayToday || (isSelectedDayPrevious && canAddToPreviousDay)
		: isViewingCurrentMonth;
	const activeBottomInset = selectedDay ? 110 : 170;
	const activeViewportHeight = selectedDay ? undefined : 320;
	const onActiveScrollDown = onCollapseToWeekView;
	const onActivePullDown = onExpandToMonthView;
	const onActiveAddMemoryPress =
		selectedDay && isSelectedDayPrevious && canAddToPreviousDay
			? onAddPreviousDayMemoryPress
			: onAddTodayMemoryPress;

	return (
		<View
			className="px-4 pb-5 pt-5"
			style={{ backgroundColor: "transparent" }}
		>
			<View className="mb-2 flex-row items-center justify-between px-1">
				<View className="flex-row items-center">
					{!isYearOverviewOpen ? (
						<Animated.View
							pointerEvents={selectedDay ? "auto" : "none"}
							style={{
								width: headerResetProgress.interpolate({
									inputRange: [0, 1],
									outputRange: [0, 24],
								}),
								marginRight: headerResetProgress.interpolate({
									inputRange: [0, 1],
									outputRange: [0, 6],
								}),
								opacity: headerResetProgress,
								overflow: "hidden",
							}}
						>
							<Pressable
								className="rounded-md py-1 active:opacity-70"
								hitSlop={10}
								onPress={() => {
									if (selectedDay) {
										onResetSelectedDay();
									}
								}}
							>
								<ArrowLeftIcon
									color={calendarIconColor}
									height={16}
									width={16}
								/>
							</Pressable>
						</Animated.View>
					) : null}
					<Animated.View
						style={{
							transform: [
								{
									translateX: headerResetProgress.interpolate({
										inputRange: [0, 1],
										outputRange: [0, 4],
									}),
								},
							],
						}}
					>
						<Pressable
							className="rounded-xl py-1 active:opacity-70"
							onPress={onOpenYearOverview}
						>
							{!isYearOverviewOpen ? (
								<Text
									className="text-[27px] font-semibold leading-[31px] tracking-[-0.6px]"
									style={{
										color: theme.textPrimary,
									}}
								>
									{monthTitle(visibleMonth)}
								</Text>
							) : (
								<View style={{ height: 10 }} />
							)}
						</Pressable>
					</Animated.View>
				</View>
				<Pressable
					className="rounded-lg p-2 active:opacity-70"
					style={{ marginTop: -8, marginLeft: 12 }}
					onPress={
						isYearOverviewOpen ? onJumpToCurrentMonth : onOpenYearOverview
					}
				>
					{isYearOverviewOpen ? (
						<CalendarToIcon color={calendarIconColor} height={22} width={22} />
					) : (
						<CalendarIcon color={calendarIconColor} height={22} width={22} />
					)}
				</Pressable>
			</View>

			<View>
				{isYearOverviewOpen ? (
					<View>
						<ScrollView
							ref={overviewScrollRef}
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{ paddingBottom: 120 }}
						>
							{yearRange.map((year) => (
								<View
									key={year}
									className="mb-3"
									onLayout={(event) => {
										yearOffsetsRef.current[year] = event.nativeEvent.layout.y;
									}}
								>
									<Text
										className="mb-2 text-[20px] font-semibold"
										style={{ color: theme.accent }}
									>
										{year}
									</Text>
									<View className="flex-row flex-wrap justify-between">
										{monthNames.map((monthName, index) => {
											const month = index + 1;
											const isLocked =
												(year === minimumYear && month < minimumMonthNumber) ||
												(year === maximumYear && month > maximumMonthNumber) ||
												year < minimumYear ||
												year > maximumYear;
											if (isLocked) {
												return null;
											}
											const isActive =
												year === visibleYear && month === visibleMonthNumber;
											const weeks = buildMonthWeeks(year, month);
											return (
												<Pressable
													key={toMonthKey(year, month)}
													className="mb-6 rounded-2xl px-3 py-2"
													style={{
														width: "48%",
														backgroundColor: isActive
															? `${theme.accent}22`
															: "transparent",
													}}
													onLayout={(event) => {
														const monthKey = toMonthKey(year, month);
														monthOffsetsRef.current[monthKey] =
															event.nativeEvent.layout.y +
															(yearOffsetsRef.current[year] ?? 0);
														if (
															pendingFocusMonthKeyRef.current === monthKey &&
															overviewScrollRef.current
														) {
															overviewScrollRef.current.scrollTo({
																y: Math.max(
																	0,
																	monthOffsetsRef.current[monthKey] - 24,
																),
																animated: false,
															});
															pendingFocusMonthKeyRef.current = null;
														}
													}}
													onPress={() => onSelectOverviewMonth(year, month)}
												>
													<Text
														className="mb-1 text-[18px] font-semibold"
														style={{
															color: isActive
																? theme.accent
																: theme.textPrimary,
														}}
													>
														{monthName.slice(0, 3)}
													</Text>
													<View className="mb-1 flex-row">
														{weekDayLetters.map((day, dayIndex) => (
															<View
																key={`${year}-${monthName}-${dayIndex}`}
																className="items-center justify-center"
																style={{ flex: 1, height: 14 }}
															>
																<Text
																	className="text-[8px] font-semibold"
																	style={{
																		color: theme.textTertiary,
																		lineHeight: 12,
																	}}
																>
																	{day}
																</Text>
															</View>
														))}
													</View>
													{weeks.map((week, weekIndex) => (
														<View
															key={`${year}-${monthName}-week-${weekIndex}`}
															className="flex-row"
															style={{ height: 16 }}
														>
															{week.map((day, dayIndex) => (
																<View
																	key={`${year}-${monthName}-day-${weekIndex}-${dayIndex}`}
																	className="items-center justify-center"
																	style={{ flex: 1, height: 16 }}
																>
																	<View
																		className="items-center justify-center rounded-full"
																		style={
																			day &&
																			year === todayYear &&
																			month === todayMonth &&
																			day === todayDay
																				? {
																						height: 18,
																						width: 18,
																						backgroundColor: todayCircleColor,
																					}
																				: { height: 18, width: 18 }
																		}
																	>
																		<Text
																			className="text-[10px] font-medium"
																			style={{
																				color:
																					day &&
																					year === todayYear &&
																					month === todayMonth &&
																					day === todayDay
																						? "#ffffff"
																						: theme.textPrimary,
																				lineHeight: 11,
																			}}
																		>
																			{day ?? ""}
																		</Text>
																	</View>
																</View>
															))}
														</View>
													))}
												</Pressable>
											);
										})}
									</View>
								</View>
							))}
						</ScrollView>
					</View>
				) : (
					<>
						<View className="mb-2 flex-row px-1">
							{weekDays.map((day) => (
								<View
									key={day}
									className="flex-1 items-center justify-center py-1"
								>
									<Text
										className="text-[12px] font-semibold tracking-wide"
										style={{ color: theme.textTertiary }}
									>
										{day}
									</Text>
								</View>
							))}
						</View>

						<Animated.View
							{...panResponder.panHandlers}
							style={{
								opacity: transitionProgress,
								transform: [
									{
										translateX: transitionProgress.interpolate({
											inputRange: [0, 1],
											outputRange: [transitionDirection * 34, 0],
										}),
									},
								],
							}}
						>
							<Animated.View
								style={{ overflow: "hidden", height: monthGridHeight }}
							>
								<Animated.View
									style={{
										transform: [
											{
												translateY: selectedWeekOffset,
											},
										],
									}}
								>
									{visibleMonthWeeks.map((week, weekIndex) => (
										<View
											key={`${visibleMonth}-week-${weekIndex}`}
											className="flex-row"
											style={{ height: monthWeekRowHeight }}
										>
											{week.map((day, dayIndex) => {
												if (!day) {
													return (
														<View
															key={`${visibleMonth}-empty-${weekIndex}-${dayIndex}`}
															className="flex-1 items-center justify-center"
														/>
													);
												}
												const dateKey = `${visibleMonth}-${String(day).padStart(2, "0")}`;
												const isToday = dateKey === todayKey;
												const isSelected =
													selectedDay === day &&
													selectedWeekIndex === weekIndex;
												const dayMemories = getMemories(
													toDayKey(visibleMonth, day),
												);
												const hasMemories = dayMemories.length > 0;
												const canOpenDay = isToday || hasMemories;
												const dayMemoryPreviewColors =
													dotColorsByDay[dateKey as DayKey] ?? [];
												return (
													<DayCell
														key={`${visibleMonth}-day-${weekIndex}-${dayIndex}`}
														day={day}
														memoryPreviewColors={dayMemoryPreviewColors}
														hasMemories={canOpenDay}
														isSelected={isSelected}
														isToday={isToday}
														textColor={theme.textPrimary}
														todayCircleColor={todayCircleColor}
														selectedDayBackgroundColor={
															selectedDayBackgroundColor
														}
														onPress={() => {
															if (!canOpenDay) {
																return;
															}
															onDayPress(day, weekIndex);
														}}
													/>
												);
											})}
										</View>
									))}
								</Animated.View>
							</Animated.View>

							{shouldShowMemoriesPanel ? (
								<Animated.View
									style={{
										opacity: selectedDay ? selectedContentProgress : 1,
										transform: [
											{
												translateY: selectedDay
													? selectedContentProgress.interpolate({
															inputRange: [0, 1],
															outputRange: [14, 0],
														})
													: 0,
											},
										],
										marginTop: 8,
									}}
								>
									<SelectedDayMemories
										dateLabel={activeDateLabel}
										memories={activeMemories}
										onAddPress={onActiveAddMemoryPress}
										onDeleteMemory={onDeleteMemoryPress}
										canAddMemory={activeCanAddMemory}
										onScrollDown={onActiveScrollDown}
										onPullDown={onActivePullDown}
										onImageViewerVisibilityChange={setIsImageViewerOpen}
										bottomInset={activeBottomInset}
										viewportHeight={activeViewportHeight}
										textPrimary={theme.textPrimary}
										textSecondary={theme.textSecondary}
										cardColor={theme.card}
										addButtonBgColor={selectedDayBackgroundColor}
										addButtonIconColor={actionBlue}
									/>
								</Animated.View>
							) : isViewingCurrentMonth ? (
								<View className="items-center pt-10">
									<Pressable
										className="h-12 w-12 items-center justify-center rounded-full active:opacity-70"
										onPress={onAddTodayMemoryPress}
										style={{ backgroundColor: selectedDayBackgroundColor }}
									>
										<Text
											className="text-[28px] font-semibold leading-[30px]"
											style={{ color: actionBlue }}
										>
											+
										</Text>
									</Pressable>
								</View>
							) : null}
						</Animated.View>
					</>
				)}
			</View>
		</View>
	);
}
