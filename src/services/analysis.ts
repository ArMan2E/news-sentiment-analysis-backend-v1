import { groq } from './groqClient';

interface AnalysisResult {
	language?: string;
	summary?: string;
	sentiment?: string;
	mood?: string;
	bias_level?: string;
	bias_direction?: string;
	subjectivity?: string;
	indicators?: string[];
	reasoning?: string;
	error?: string;
	details?: string;
}

export async function analyzeNewsWithGroqImage(content: string): Promise<AnalysisResult> {
	try {
		const response = await groq.chat.completions.create({
			messages: [
				{
					role: "system",
					content: `You are a multilingual media analysis expert specializing in emotion, bias, and language framing.:
					Give atleast 50 words summary.
					Given the following news input from user, analyze it and return a well-structured JSON object with
				
          - language
          - summary
          - sentiment
          - mood
          - bias_level
          - bias_direction
          - subjectivity
          - indicators
          - reasoning`
				},
				{
					role: "user",
					content: [
						{
							"type": "image_url",
							"image_url": {
								"url": `data:image/jpeg;base64,${content}`,
							}
						}
					]
				}
			],
			model: "meta-llama/llama-4-scout-17b-16e-instruct",
			response_format: { type: "json_object" }
		});
		console.log(response.choices[0].message.content)

		const data = response.choices[0].message.content
		if (data === null) {
			throw new Error(" the content is null");
		}
		return JSON.parse(data) as AnalysisResult;
	} catch (error: any) {
		console.error("Groq analysis error:", error);
		return {
			error: "Analysis failed",
			details: error.message
		};
	}
}
export async function analyzeNewsWithGroqAudio(content: string): Promise<AnalysisResult> {
	try {
		const response = await groq.chat.completions.create({
			messages: [
				{
					role: "system",
					content: `You are a multilingual media analysis expert specializing in emotion, bias, and language framing.:
					Give atleast 50 words summary.
					Given the following news input from user, analyze it and return a well-structured JSON object with
				
          - language
          - summary
          - sentiment
          - mood
          - bias_level
          - bias_direction
          - subjectivity
          - indicators
          - reasoning`
				},
				{
					role: "user",
					content: content
				}
			],
			model: "meta-llama/llama-4-scout-17b-16e-instruct",
			response_format: { type: "json_object" }
		});
		console.log(response.choices[0].message.content)

		const data = response.choices[0].message.content
		if (data === null) {
			throw new Error(" the content is null");
		}
		return JSON.parse(data) as AnalysisResult;
	} catch (error: any) {
		console.error("Groq analysis error:", error);
		return {
			error: "Analysis failed",
			details: error.message
		};
	}
}
