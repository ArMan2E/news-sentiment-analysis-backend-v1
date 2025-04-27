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

export async function analyzeNewsWithGroq(content: string): Promise<AnalysisResult> {
	try {
		const response = await groq.chat.completions.create({
			messages: [
				{
					role: "system",
					content: `You are a multilingual media analysis expert. Analyze the provided content and return a JSON object with:
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
		if(data === null){
			throw new Error(" the content is null")	;
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
