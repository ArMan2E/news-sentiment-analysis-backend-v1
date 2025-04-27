import { Router } from 'express';
import { upload } from '../middlewares/upload';
import { extractTextFromImage, transcribeAudio } from '../services/textExtraction';
import { analyzeNewsWithGroq } from '../services/analysis';
import path from 'path';
import fs from 'fs';

const groqChatBotRoute = Router();

groqChatBotRoute.post('/', upload.single('file'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No file uploaded' });
		}

		const filePath = req.file.path;
		let text = '';
		let fileType = 'unknown';

		try {
			if (isImage(req.file)) {
				// Extract text from image using OCR
				text = await extractTextFromImage(filePath);
				fileType = 'image';
			} else if (isAudio(req.file)) {
				text = await transcribeAudio(filePath);
				fileType = 'audio';
			}

			// Process the file data
			const analysis = await analyzeNewsWithGroq(text);

			// Delete the temporary file once processing is complete
			fs.unlink(filePath, (err) => {
				if (err) console.error(`Error deleting temporary file ${filePath}:`, err);
				else console.log(`Successfully deleted temporary file: ${filePath}`);
			});

			res.json({
				fileType,
				extractedText: text,
				analysis
			});
		} catch (err) {
			fs.unlink(filePath, () => { });
			return res.status(500).json({ error: 'Error processing file'});
		}
	} catch (error) {
		res.status(500).json({ error: 'Server error'});
	}
});

function isImage(file: Express.Multer.File): boolean {
	return /jpeg|jpg|png|gif/.test(path.extname(file.originalname).toLowerCase());
}

function isAudio(file: Express.Multer.File): boolean {
	return /mp3|wav|ogg|mpeg/.test(path.extname(file.originalname).toLowerCase());
}

export default groqChatBotRoute;
