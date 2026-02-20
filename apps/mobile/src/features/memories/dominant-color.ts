function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function hashToColor(value: string): string {
	let hash = 0;
	for (let index = 0; index < value.length; index += 1) {
		hash = (hash << 5) - hash + value.charCodeAt(index);
		hash |= 0;
	}
	const hue = Math.abs(hash) % 360;
	const saturation = 55 + (Math.abs(hash >> 3) % 20);
	const lightness = 48 + (Math.abs(hash >> 6) % 16);
	return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function pickColorFromNativeResult(result: Record<string, unknown>): string | null {
	const candidates = [
		result.dominant,
		result.primary,
		result.secondary,
		result.detail,
		result.background,
	];

	for (const candidate of candidates) {
		if (typeof candidate === "string" && candidate.trim().length > 0) {
			return candidate;
		}
	}
	return null;
}

export async function resolveDominantColor(uri: string): Promise<string> {
	// Fallback works even when native color extraction package is not installed.
	const fallback = hashToColor(uri);
	try {
		const imageColors = require("react-native-image-colors") as
			| {
					getColors?: (
						source: string,
						options?: Record<string, unknown>,
					) => Promise<Record<string, unknown>>;
			  }
			| undefined;
		const getColors = imageColors?.getColors;
		if (!getColors) {
			return fallback;
		}

		const result = await getColors(uri, {
			fallback,
			cache: true,
			key: uri,
		});
		return pickColorFromNativeResult(result) ?? fallback;
	} catch {
		return fallback;
	}
}
