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
const groqApiKeys: string[] = process.env.GROQ_API_KEYS?.split(",") || [];
//let keyUsageCount: number[] = new Array(groqApiKeys.length).fill(0);// init the token count with 0

//buffer api key for a failed req ???
let bufferGroqApiKeys: string[];
let currentKeyIndex = 0;

//const MAX_REQ_BEFORE_ROTATION = 10;

async function preflightCheckForKey(apiKey: string): Promise<number> {
  const model = "llama3-70b-8192"
  try {
    const response = await axios.get(`https://api.groq.com/openai/v1/models/${model}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    )
    const remainingTokensPerDay = parseInt(response.headers["x-ratelimit-limit-tokens"])
    return remainingTokensPerDay;
  } catch(error){
    console.error(`failed to check rate limit for API KEY ${apiKey}`);
    return 0;// if preflight failed, key unavailable fro groq
  }
}

async function getLeastUsedKey(): Promise<string> {
  // returns obj of type {apikey, remainingTokens, index}
  const tokenUsages = await Promise.all(
    groqApiKeys.map(async (apiKey, index) => {
      const remainingTokens = await preflightCheckForKey(apiKey);
      return {apiKey, remainingTokens, index};
    })
  )

  // sort keys by remaining tokens in desending order
  tokenUsages.sort((a,b) => b.remainingTokens - a.remainingTokens);
  const selectedKey = tokenUsages[0];// key with most remaining tokens
  bufferGroqApiKeys = tokenUsages.map(apiKey => apiKey.apiKey);
  return selectedKey.apiKey;
}
console.log(`groq api keys ${groqApiKeys.length}`);
if (groqApiKeys.length === 0) {
  throw new Error("No Groq API keys configured. Please set GROQ_API_KEYS in .env");
}

function getNextApiKey() {
  // from second(2) api key as first one is least used already by preflight
  currentKeyIndex = (currentKeyIndex + 2) % groqApiKeys.length;
  return bufferGroqApiKeys[currentKeyIndex];
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
    model: "llama3-70b-8192",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: `Title: ${title}\nSource: ${source}\nContent:${content}` }
    ],
    temperature: 0.4,
    response_format: { type: "json_object" }
  };

  let attempt = 0;
  const maxAttempts = groqApiKeys.length;
  console.log(`Attempt ${attempt + 1} using key index ${currentKeyIndex}: ${groqApiKeys[currentKeyIndex]}`);
  let apiKey = await getLeastUsedKey();// perform preflight
  while (attempt < maxAttempts) {
    //let apiKey = groqApiKeys[currentKeyIndex];

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
      //console.log(`Remaining tokens: ${remainingTokens}`);

      if (remainingTokens < 1500) {
        console.warn(`Low token ${remainingTokens} hit for key ${apiKey}. Switching next key...`);
        apiKey = getNextApiKey();
        attempt++;// Optional, can count this analysis as an attempt

        await new Promise(res => setTimeout(res, 500)); // 0.5s delay before retry

        continue;// Retry with next key;
      }

      const rawContent = response.data.choices[0]?.message?.content?.trim();
      if (!rawContent) throw new Error("No content returned from Groq");

      const cleaned = cleanJsonResponse(rawContent);
      //console.log(cleaned);
      return JSON.parse(cleaned);
    } catch (error: any) {
      const status = error.response?.status;
      //const headers = error.response?.headers || {};
      if (status === 429) {
        // from buffer array
        apiKey = getNextApiKey();
        attempt++;// count this an attempt
        await new Promise(res => setTimeout(res, 500)); // 0.5s delay before retry

        continue; // retry again
      } else {
        console.error("Groq request failed:", error.message || error);
        throw new Error("Groq analysis failed");
      }
    }
  }

  throw new Error(`API keys exhausted or failed. ${groqApiKeys[currentKeyIndex]}`);
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
