import fs from 'fs';
import { groq } from './groqClient';

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
