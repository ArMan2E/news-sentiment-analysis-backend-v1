import fs from 'fs';
import tesseract from 'tesseract.js';
import { groq } from './groqClient';

// Extract text from image using OCR (Tesseract.js)
export async function extractTextFromImage(imagePath: string): Promise<string> {
	try {
		const result = await tesseract.recognize(imagePath, 'eng', {
			logger: (m) => console.log(m),
		});
		return result.data.text;
	} catch (error) {
		console.error("Image OCR error:", error);
		return "Error extracting text from image";
	}
}

// Transcribe audio using Groq
export async function transcribeAudio(audioPath: string): Promise<string> {
	try {
		const audioFile = fs.createReadStream(audioPath);
		const transcription = await groq.audio.transcriptions.create({
			file: audioFile,
			model: "whisper-large-v3-turbo"
		});
		return transcription.text;
	} catch (error) {
		console.error("Audio transcription error:", error);
		return "Error transcribing audio";
	}
}
