import axios from "axios";
import Groq from "groq-sdk";

//const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface GroqAnalysisResult {
  language: string;
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  mood: string;
  bias_level: "objective" | "slightly biased" | "strongly biased";
  bias_direction: string;
  subjectivity: number;
  indicators: string[];
  reasoning: string;
}

export function cleanJsonResponse(response: string): string {
  const withoutBackticks = response
    .replace(/```json\n?/gi, "") // remove ```json
    .replace(/```/g, "") // remove trailing ```
    .trim();

  // Optionally extract just the JSON object if the response contains extra text
  const jsonMatch = withoutBackticks.match(/{[\s\S]+}/);
  if (!jsonMatch) throw new Error(" No JSON found in Groq response");

  return jsonMatch[0];
}

// return type is Promise
export async function analyzeNewsWithQroq(
  title: string,
  source: string,
  content: string = ""
): Promise<GroqAnalysisResult> {
  const promptSystem = `
    You are a multilingual media analysis expert specializing in emotion, bias, and language framing.

    Given the following news input from user, analyze it and return a well-structured JSON object with:
    From the given input Content and Title generate the summary give atleast 50 to 50 words in concise summary 

    1. language
    2. summary
    3. sentiment
    4. mood
    5. bias_level
    6. bias_direction
    7. subjectivity
    8. indicators
    9. reasoning

    Input:
    Title: "${title}"
    Source: ${source}
    Content: "${content}"

    Return your analysis strictly in JSON format with the exact keys:

    {
      "language": "...",
      "summary": "...",
      "sentiment": "...",
      "mood": "...",
      "bias_level": "...",
      "bias_direction": "...",
      "subjectivity": ...,
      "indicators": ["...", "..."],
      "reasoning": "..."
    }`;

  const promptUser = `
    You are a multilingual media analysis expert specializing in emotion, bias, and language framing.

    Given the following news input from user, analyze it and return a well-structured JSON object with:
    From the given input Content and Title generate the summary give atleast 50 to 50 words in concise summary 

    1. language
    2. summary
    3. sentiment
    4. mood
    5. bias_level
    6. bias_direction
    7. subjectivity
    8. indicators
    9. reasoning

    Input:
    Title: "${title}"
    Source: ${source}
    Content: "${content}"

    "response_format" : {"type": "json_object:}
    Return your analysis strictly in JSON format with the exact keys:

    {
      "language": "...",
      "summary": "...",
      "sentiment": "...",
      "mood": "...",
      "bias_level": "...",
      "bias_direction": "...",
      "subjectivity": ...,
      "indicators": ["...", "..."],
      "reasoning": "..."
    }`;
  //console.log(process.env.GROQ_API_KEY);
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: promptSystem,
        },
        {
          role: "user",
          content: promptUser,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      stream: false,
    });
    // const response = await axios.post(
    //   GROQ_API_URL,
    //   {
    //     model: "llama-3.3-70b-versatile",
    //     messages: [{ role: "user", content: prompt }],
    //     temperature: 0.4,
    //   },
    //   {
    //     headers: {
    //       Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    // 			'Content-Type': 'application/json'
    //     },
    //   }
    // );
    const rawContent = response.choices[0]?.message?.content?.trim(); // groq documentation
    if (!rawContent) throw new Error("Groq not returned anything");
    //console.log(response.choices[0]?.message?.content);
    const cleanContent = cleanJsonResponse(rawContent);
    console.log(cleanContent);
    return JSON.parse(cleanContent);
  } catch (error: any) {
    console.error("Groq error", error.response?.data || error.message);
    throw new Error("Groq  error"); // throw error for typescript satisfaction !!!
  }
}
