import multer, { FileFilterCallback } from 'multer';
import os from 'os';
import path from 'path';

// Define file interface for type checking
interface FileWithOriginalname extends Express.Multer.File {
	originalname: string;
}

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		const uploadDir = './uploadImg';
		cb(null,uploadDir);
	},
	filename: (_req, file, cb) => {
		cb(null, Date.now() + path.extname(file.originalname));
	}
});

const upload = multer({
	storage,
	limits: { fileSize: 25 * 1024 * 1024 }, // 25MB for audio files
	fileFilter: (_req, file, cb: FileFilterCallback) => {
		const allowedTypes = /jpeg|jpg|png|gif|mp3|wav|ogg|mpeg/;
		const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
		const mimetype = allowedTypes.test(file.mimetype);
		if (extname && mimetype) {
			cb(null, true);
		} else {
			cb(new Error('Only image and audio files are allowed!'));
		}
	}
});

export { upload };
