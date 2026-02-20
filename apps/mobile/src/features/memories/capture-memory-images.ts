import { ActionSheetIOS, Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";

type MemorySource = "camera" | "gallery";
export type CapturedMemoryAsset = {
	uri: string;
	width: number | null;
	height: number | null;
};

async function pickMemorySource(): Promise<MemorySource | null> {
	if (Platform.OS === "ios") {
		return new Promise((resolve) => {
			ActionSheetIOS.showActionSheetWithOptions(
				{
					options: ["Cancel", "Take a photo", "Upload from gallery"],
					cancelButtonIndex: 0,
				},
				(selectedIndex) => {
					if (selectedIndex === 1) {
						resolve("camera");
						return;
					}
					if (selectedIndex === 2) {
						resolve("gallery");
						return;
					}
					resolve(null);
				},
			);
		});
	}

	return new Promise((resolve) => {
		Alert.alert("Add memory", "Choose a source", [
			{ text: "Cancel", style: "cancel", onPress: () => resolve(null) },
			{ text: "Take a photo", onPress: () => resolve("camera") },
			{ text: "Upload from gallery", onPress: () => resolve("gallery") },
		]);
	});
}

async function captureFromCamera(): Promise<CapturedMemoryAsset[]> {
	const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
	if (cameraPermission.status !== "granted") {
		Alert.alert("Camera access needed", "Please allow camera access to add memories.");
		return [];
	}

	try {
		const result = await ImagePicker.launchCameraAsync({
			mediaTypes: ["images"],
			allowsMultipleSelection: false,
			allowsEditing: false,
			quality: 0.8,
		});

		if (result.canceled) {
			return [];
		}

		return result.assets.map((asset) => ({
			uri: asset.uri,
			width: asset.width ?? null,
			height: asset.height ?? null,
		}));
	} catch {
		Alert.alert(
			"Camera unavailable",
			"Camera is not available on this simulator/device. Use Upload from gallery.",
		);
		return [];
	}
}

async function pickFromGallery(): Promise<CapturedMemoryAsset[]> {
	const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
	if (mediaPermission.status !== "granted") {
		Alert.alert(
			"Photos access needed",
			"Please allow photo library access to upload memories.",
		);
		return [];
	}

	const result = await ImagePicker.launchImageLibraryAsync({
		mediaTypes: ["images"],
		allowsMultipleSelection: true,
		allowsEditing: false,
		selectionLimit: 10,
		quality: 0.8,
	});

	if (result.canceled) {
		return [];
	}

	return result.assets.map((asset) => ({
		uri: asset.uri,
		width: asset.width ?? null,
		height: asset.height ?? null,
	}));
}

export async function captureMemoryImages(): Promise<CapturedMemoryAsset[]> {
	const source = await pickMemorySource();
	if (!source) {
		return [];
	}

	if (source === "camera") {
		return captureFromCamera();
	}

	return pickFromGallery();
}
