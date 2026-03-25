import { error } from '@sveltejs/kit';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { env } from '$env/dynamic/private';
import sharp from 'sharp';

export const DATA_DIRECTORY = env.DATA_DIRECTORY || '/app/.data';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const IMAGE_EXTENSIONS = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/gif': 'gif'
} as const;

export async function validateImageFile(file: File | null) {
	if (!file) {
		throw error(400, 'No file uploaded');
	}

	if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
		throw error(400, 'Invalid file type. Only JPEG, PNG, and GIF are allowed.');
	}

	if (file.size > MAX_FILE_SIZE) {
		throw error(400, 'File size exceeds the 5 MB limit');
	}

	return file;
}

export async function deleteExistingImages(
	directory: string,
	userId: number,
	extensions: string[] = ['jpg', 'jpeg', 'png', 'gif']
) {
	for (const ext of extensions) {
		const filePath = path.join(directory, `${userId}.${ext}`);
		try {
			await unlink(filePath);
		} catch (err: unknown) {
			if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
				console.error(`Failed to delete existing file: ${filePath}`, err);
			}
		}
	}
}

export async function ensureDirectoryExists(directory: string) {
	try {
		await mkdir(directory, { recursive: true });
	} catch (err) {
		console.error('Failed to create directory:', err);
		throw error(500, 'Failed to create directory');
	}
}

export async function saveImageFile(file: File, directory: string, userId: number) {
	const extension = IMAGE_EXTENSIONS[file.type as keyof typeof IMAGE_EXTENSIONS];
	const filePath = path.join(directory, `${userId}.${extension}`);
	const buffer = new Uint8Array(await file.arrayBuffer());
	await writeFile(filePath, buffer);
	return extension;
}

export async function saveProcessedImage(file: File, directory: string, userId: number) {
	const buffer = Buffer.from(await file.arrayBuffer());
	const isGif = file.type === 'image/gif';
	const extension = isGif ? 'gif' : 'png';
	const filePath = path.join(directory, `${userId}.${extension}`);

	const sharpInstance = sharp(buffer, { animated: isGif }).resize(256, 170, {
		fit: 'cover',
		position: 'center'
	});

	if (isGif) {
		await sharpInstance.gif().toFile(filePath);
	} else {
		await sharpInstance.png().toFile(filePath);
	}

	return extension;
}

export function findExistingImage(
	directory: string,
	userId: number
): { path: string; contentType: string } | null {
	const formats = [
		{ ext: 'gif', type: 'image/gif' },
		{ ext: 'png', type: 'image/png' },
		{ ext: 'jpg', type: 'image/jpeg' },
		{ ext: 'jpeg', type: 'image/jpeg' }
	];

	for (const format of formats) {
		const filePath = path.join(directory, `${userId}.${format.ext}`);
		if (existsSync(filePath)) {
			return { path: filePath, contentType: format.type };
		}
	}

	return null;
}
