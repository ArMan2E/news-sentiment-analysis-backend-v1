import axios from "axios";
import _ from "dotenv/config"
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

// Rotate through available Groq API keys
const groqApiKeys:string[] = process.env.GROQ_API_KEYS?.split(",") || [];
let currentKeyIndex = 0;
console.log(`groq api keys ${groqApiKeys}`);
if (groqApiKeys.length === 0) {
  throw new Error("No Groq API keys configured. Please set GROQ_API_KEYS in .env");
}

// kind of circular queue
function getNextApiKey() {
  currentKeyIndex = (currentKeyIndex + 1) % groqApiKeys.length;
  return groqApiKeys[currentKeyIndex];
}

export async function analyzeNewsWithQroq(
  title: string,
  source: string,
  content: string = ""
): Promise<GroqAnalysisResult> {
  const prompt = `
You are a multilingual media analysis expert specializing in emotion, bias, and language framing.

Given the following news input from user, analyze it and return a well-structured JSON object with:

1. language
2. summary (at least 50-60 words)
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

  const payload = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: `Title: ${title}\nSource: ${source}\nContent:${content}` }
    ],
    temperature: 0.4,
    response_format: { type: "json_object" }
  };

  let attempt = 0;
  const maxAttempts = groqApiKeys.length;
console.log("inside function",groqApiKeys);

  while (attempt < maxAttempts) {
    let apiKey = groqApiKeys[currentKeyIndex];
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        payload,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );

      const remainingTokens = parseInt(response.headers["x-ratelimit-remaining-tokens"]);
      console.log(`Remaining tokens: ${remainingTokens}`);

      if (remainingTokens < 1000) {
        console.warn("Token threshold low. Switching API key...");
        apiKey=getNextApiKey();
      }

      const rawContent = response.data.choices[0]?.message?.content?.trim();
      if (!rawContent) throw new Error("No content returned from Groq");

      const cleaned = cleanJsonResponse(rawContent);
      console.log(cleaned);
      return JSON.parse(cleaned);
    } catch (error: any) {
      const status = error.response?.status;
      const headers = error.response?.headers || {};

      if (status === 429) {
        const retryAfter = parseInt(headers["retry-after"]);
        console.warn(`Rate limit hit. Retrying after ${retryAfter} seconds...`);
        if (!isNaN(retryAfter)) await new Promise((res) => setTimeout(res, retryAfter * 1000));
        getNextApiKey();
      } else {
        console.error("Groq request failed:", error.message || error);
        throw new Error("Groq analysis failed");
      }
    }
    attempt++;
  }

  throw new Error("All API keys exhausted or failed.");
}


// import axios from "axios";
// import Groq from "groq-sdk";

// //const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// export interface GroqAnalysisResult {
//   language: string;
//   summary: string;
//   sentiment: "positive" | "neutral" | "negative";
//   mood: string;
//   bias_level: "objective" | "slightly biased" | "strongly biased";
//   bias_direction: string;
//   subjectivity: number;
//   indicators: string[];
//   reasoning: string;
// }

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
// export async function analyzeNewsWithQroq(
//   title: string,
//   source: string,
//   content: string = ""
// ): Promise<GroqAnalysisResult> {
//   const promptSystem = `
//     You are a multilingual media analysis expert specializing in emotion, bias, and language framing.

//     Given the following news input from user, analyze it and return a well-structured JSON object with:
//     From the given input Content and Title generate the summary give atleast 50 to 50 words in concise summary 

//     1. language
//     2. summary
//     3. sentiment
//     4. mood
//     5. bias_level
//     6. bias_direction
//     7. subjectivity
//     8. indicators
//     9. reasoning

//     Input:
//     Title: "${title}"
//     Source: ${source}
//     Content: "${content}"

//     Return your analysis strictly in JSON format with the exact keys:

//     {
//       "language": "...",
//       "summary": "...",
//       "sentiment": "...",
//       "mood": "...",
//       "bias_level": "...",
//       "bias_direction": "...",
//       "subjectivity": ...,
//       "indicators": ["...", "..."],
//       "reasoning": "..."
//     }`;

//   const promptUser = `
//     You are a multilingual media analysis expert specializing in emotion, bias, and language framing.

//     Given the following news input from user, analyze it and return a well-structured JSON object with:
//     From the given input Content and Title generate the summary give atleast 50 to 50 words in concise summary 

//     1. language
//     2. summary
//     3. sentiment
//     4. mood
//     5. bias_level
//     6. bias_direction
//     7. subjectivity
//     8. indicators
//     9. reasoning

//     Input:
//     Title: "${title}"
//     Source: ${source}
//     Content: "${content}"

//     Return your analysis strictly in JSON format with the exact keys:

//     {
//       "language": "...",
//       "summary": "...",
//       "sentiment": "...",
//       "mood": "...",
//       "bias_level": "...",
//       "bias_direction": "...",
//       "subjectivity": ...,
//       "indicators": ["...", "..."],
//       "reasoning": "..."
//     }`;
//   //console.log(process.env.GROQ_API_KEY);
//   try {
//     const response = await groq.chat.completions.create({
//       messages: [
//         {
//           role: "system",
//           content: promptSystem,
//         },
//         {
//           role: "user",
//           content: promptUser,
//         },
//       ],
//       model: "llama-3.3-70b-versatile",
//       temperature: 0.4,
//       stream: false,
//       response_format: {"type":"json_object"}
//     });
//     const headers = response.
//     // const response = await axios.post(
//     //   GROQ_API_URL,
//     //   {
//     //     model: "llama-3.3-70b-versatile",
//     //     messages: [{ role: "user", content: prompt }],
//     //     temperature: 0.4,
//     //   },
//     //   {
//     //     headers: {
//     //       Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
//     // 			'Content-Type': 'application/json'
//     //     },
//     //   }
//     // );
//     const rawContent = response.choices[0]?.message?.content?.trim(); // groq documentation
//     if (!rawContent) throw new Error("Groq not returned anything");
//     //console.log(response.choices[0]?.message?.content);
//     const cleanContent = cleanJsonResponse(rawContent);
//     console.log(cleanContent);
//     return JSON.parse(cleanContent);
//   } catch (error: any) {
//     console.error("Groq error", error.response?.data || error.message);
//     throw new Error("Groq  error"); // throw error for typescript satisfaction !!!
//   }
// }
