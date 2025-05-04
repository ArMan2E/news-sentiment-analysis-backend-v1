import { Router } from 'express';
import { upload } from '../middlewares/upload';
import { transcribeAudio } from '../services/textExtraction';
import { analyzeNewsWithGroqAudio, analyzeNewsWithGroqImage } from '../services/analysis';
import path from 'path';
import fs from 'fs';
import { AnalysisResult } from '../interfaces/analysisInterfaces';

const groqChatBotRoute = Router();

groqChatBotRoute.post('/analyze', upload.single('file'), async (req, res) => {
	console.log("inside endpoint /analyze")
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No file uploaded' });
		}

		const filePath = req.file.path;
		let text = '';
		let fileType = 'unknown';
		let analysis: AnalysisResult | null = null;
		console.log("file, ", filePath);
		try {
			if (isImage(req.file)) {
				// Extract text from image using OCR
				console.log("image file ", filePath);
				const imageBuffer = fs.readFileSync(filePath);
				const base64Image = imageBuffer.toString('base64');

				text = base64Image;
				 analysis = await analyzeNewsWithGroqImage(text);
				if (text === 'Error extracting text from image') {
					return res.status(500).json({ error: 'OCR failed to extract text' });
				}
				fileType = 'image';
			} else if (isAudio(req.file)) {
				text = await transcribeAudio(filePath);
				analysis = await analyzeNewsWithGroqAudio(text);
				fileType = 'audio';
			}

			// Process the file data

			// Delete the temporary file once processing is complete
			fs.unlink(filePath, (err) => {
				if (err) console.error(`Error deleting temporary file ${filePath}:`, err);
				else console.log(`Successfully deleted temporary file: ${filePath}`);
			});
			if(!analysis){
				return res.status(500).json({error: "No analysis result generated"});
			}
			res.json({
				fileType,
				analysis
			});
		} catch (err) {
			fs.unlink(filePath, (err) => {
				if (err) console.error(`Error deleting temporary file ${filePath}:`, err);
				else console.log(`Successfully deleted temporary file: ${filePath}`);
			});
			return res.status(500).json({ error: 'Error processing file' });
		}
	} catch (error) {
		res.status(500).json({ error: 'Server error' });
	}
});

function isImage(file: Express.Multer.File): boolean {
	return /jpeg|jpg|png|gif/.test(path.extname(file.originalname).toLowerCase());
}

function isAudio(file: Express.Multer.File): boolean {
	return /mp3|wav|ogg|mpeg/.test(path.extname(file.originalname).toLowerCase());
}

export default groqChatBotRoute;
