import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import type { TripPreviewImage } from "../../features/trips/repository";
import type { AppTheme } from "../../theme/colors";

function hashColor(uri: string): string {
	let hash = 0;
	for (let i = 0; i < uri.length; i += 1) {
		hash = (hash << 5) - hash + uri.charCodeAt(i);
		hash |= 0;
	}
	return `hsl(${Math.abs(hash) % 360}, 55%, 62%)`;
}

const CARD_WIDTH = 164;
const GLASS_HEIGHT = 100;
const IMAGE_SIZE = 78;
const IMAGE_PEEK = 42;
const TOTAL_HEIGHT = GLASS_HEIGHT + IMAGE_PEEK;

type FanLayout = { translateX: number; rotate: string };

const FAN_LAYOUTS: Record<number, FanLayout[]> = {
	1: [{ translateX: 0, rotate: "0deg" }],
	2: [
		{ translateX: -18, rotate: "-10deg" },
		{ translateX: 18, rotate: "8deg" },
	],
	3: [
		{ translateX: -30, rotate: "-14deg" },
		{ translateX: 0, rotate: "0deg" },
		{ translateX: 30, rotate: "12deg" },
	],
	4: [
		{ translateX: -36, rotate: "-15deg" },
		{ translateX: -12, rotate: "-5deg" },
		{ translateX: 12, rotate: "5deg" },
		{ translateX: 36, rotate: "15deg" },
	],
};

export type TripFolderCardProps = {
	name?: string;
	previews?: TripPreviewImage[];
	memoryCount?: number;
	theme: AppTheme;
	onPress: () => void;
	variant?: "trip" | "create";
};

export function TripFolderCard({
	name,
	previews,
	memoryCount,
	theme,
	onPress,
	variant = "trip",
}: TripFolderCardProps) {
	const safePreviews = previews ?? [];
	const safeMemoryCount = memoryCount ?? 0;
	const imageCount =
		variant === "create" ? 0 : Math.min(safePreviews.length, 4);
	const fanLayouts = FAN_LAYOUTS[imageCount] ?? [];
	const previewStack = safePreviews.slice(0, 4).reverse();
	const isDark = theme.background === "#1c1c1e";
	const hasImages = imageCount > 0;
	const title = variant === "create" ? "New Trip" : (name ?? "Trip");
	const glassShadowStyle = {
		shadowOpacity: isDark ? 0 : variant === "create" ? 0.06 : 0.1,
		shadowOffset: { width: 0, height: isDark ? 0 : variant === "create" ? 10 : 12 },
		shadowRadius: isDark ? 0 : variant === "create" ? 18 : 26,
		elevation: isDark ? 0 : variant === "create" ? 4 : 8,
	} as const;

	return (
		<Pressable
			style={{ width: "48%", marginBottom: 20 }}
			onPress={onPress}
			className="active:opacity-80"
		>
			<View style={styles.cardRoot}>
				{/* Always use full height so empty and non-empty cards align */}
				<View style={{ width: CARD_WIDTH, height: TOTAL_HEIGHT }}>
					{hasImages &&
						previewStack.map((preview, idx) => {
							const layout = fanLayouts[idx];
							return (
								<View
									key={preview.uri}
									style={[
										styles.fanImage,
										{
											top: 0,
											left: (CARD_WIDTH - IMAGE_SIZE) / 2,
											zIndex: idx + 1,
											transform: [
												{ translateX: layout.translateX },
												{ rotate: layout.rotate },
											],
										},
									]}
								>
									{preview.uri.startsWith("mock://") ? (
										<View
											style={[
												styles.fanImageInner,
												{
													backgroundColor:
														preview.dominantColor ?? hashColor(preview.uri),
												},
											]}
										/>
									) : (
										<Image
											source={{ uri: preview.uri }}
											style={styles.fanImageInner}
											resizeMode="cover"
										/>
									)}
								</View>
							);
						})}

					<View
						style={[
							styles.glassShadow,
							{ zIndex: imageCount + 2 },
							glassShadowStyle,
						]}
					>
						<View
							style={[
								styles.glassOuter,
								{
									borderColor: isDark
										? "rgba(255,255,255,0.2)"
										: "rgba(255,255,255,0.55)",
								},
							]}
						>
							<BlurView
								intensity={hasImages ? 30 : 0}
								tint={isDark ? "dark" : "light"}
								style={StyleSheet.absoluteFill}
							/>
							<View
								style={[
									StyleSheet.absoluteFill,
									{
										backgroundColor: hasImages
											? isDark
												? "rgba(255,255,255,0.08)"
												: "rgba(255,255,255,0.35)"
											: isDark
												? "rgba(58,58,60,0.80)"
												: "rgba(235,235,240,0.85)",
									},
								]}
							/>
							{variant === "create" ? (
								<View
									style={[
										styles.plusBubble,
										{
											backgroundColor: isDark
												? "rgba(255,255,255,0.18)"
												: "rgba(0,0,0,0.06)",
										},
									]}
								>
									<Text style={[styles.plusText, { color: theme.accent }]}>
										+
									</Text>
								</View>
							) : null}
							<View style={styles.glassContent}>
								<Text
									style={[styles.titleText, { color: theme.textPrimary }]}
									numberOfLines={1}
								>
									{title}
								</Text>
								{variant === "trip" ? (
									<View
										style={[
											styles.countPill,
											{
												backgroundColor: isDark
													? "rgba(255,255,255,0.12)"
													: "rgba(0,0,0,0.05)",
											},
										]}
									>
										<Text
											style={[styles.countText, { color: theme.textTertiary }]}
										>
											{safeMemoryCount}{" "}
											{safeMemoryCount === 1 ? "memory" : "memories"}
										</Text>
									</View>
								) : null}
							</View>
						</View>
					</View>
				</View>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	cardRoot: {
		alignItems: "center",
	},
	fanImage: {
		position: "absolute",
		width: IMAGE_SIZE,
		height: IMAGE_SIZE,
		borderRadius: 12,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 0.24,
		shadowRadius: 8,
		elevation: 8,
	},
	fanImageInner: {
		width: "100%",
		height: "100%",
		borderRadius: 12,
	},
	glassOuter: {
		width: CARD_WIDTH,
		height: GLASS_HEIGHT,
		borderRadius: 20,
		overflow: "hidden",
		borderWidth: 1,
	},
	glassShadow: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		borderRadius: 20,
		shadowColor: "#000",
	},
	glassContent: {
		flex: 1,
		justifyContent: "flex-end",
		alignItems: "center",
		paddingBottom: 12,
		paddingHorizontal: 12,
	},
	plusBubble: {
		position: "absolute",
		top: 14,
		left: "50%",
		marginLeft: -18,
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	plusText: {
		fontSize: 28,
		fontWeight: "500",
		lineHeight: 29,
	},
	titleText: {
		fontSize: 17,
		fontWeight: "600",
		textAlign: "center",
	},
	countPill: {
		marginTop: 5,
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 4,
	},
	countText: {
		fontSize: 12,
		fontWeight: "500",
	},
});
