import { Directory, File, Paths } from "expo-file-system";

function getExtension(uri: string): string {
	const normalized = uri.split("?")[0] ?? uri;
	const dotIndex = normalized.lastIndexOf(".");
	if (dotIndex <= 0 || dotIndex === normalized.length - 1) {
		return "jpg";
	}
	return normalized.slice(dotIndex + 1);
}

export async function persistMemoryImage(params: {
	sourceUri: string;
	userId: string;
	dayKey: string;
	memoryId: string;
}) {
	const { sourceUri, userId, dayKey, memoryId } = params;
	const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
	const dayDir = new Directory(Paths.document, "memories", safeUserId, dayKey);
	dayDir.create({ idempotent: true, intermediates: true });
	const extension = getExtension(sourceUri);
	const destination = new File(dayDir, `${memoryId}.${extension}`);
	if (destination.exists) {
		destination.delete();
	}
	const source = new File(sourceUri);
	source.copy(destination);
	return destination.uri;
}
