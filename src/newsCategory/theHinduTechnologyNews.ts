import { analyzeNewsWithQroq } from "../util/sentiment-groq";
import transformThTechnologyData from "../util/transformRssToJson/transformThTechnologyRSSJson";
import { CleanedNewsStruct } from "../util/transformRssToJson/transformThTechnologyRSSJson";
import { connectAndStream } from "../lib/fluvio";
import { TTLCache } from "../util/CacheUtil";
// the pointer is important it signifies generator function to yield SSE
// TTL in millis
const TTL_DURATION = 10 * 60 * 1000;

const seenUrlsWithTimestamps = new TTLCache(TTL_DURATION);

export default async function* theHinduTechnologyNews(signal: AbortSignal) {
  const topic = "rss-th-technology-topic";
  const jsonStreamRecord = await connectAndStream(topic);

  for await (const record of jsonStreamRecord) {
    if (signal.aborted) {
      console.log("Stream aborted.");
      break;
    }

    try {
      const raw = record.valueString();
      const parsedData = JSON.parse(raw);
      const cleanedThTechnologyData = transformThTechnologyData(parsedData);

      // Clean up expired cache keys before processing this batch
      seenUrlsWithTimestamps.cleanup();

      const analyzedTrends = await Promise.all(
        cleanedThTechnologyData.news.map(async (item: CleanedNewsStruct) => {
          try {
            const cacheKey = `${item.newsUrl}+${item.title}`;
            
            // Check if the news item is still within TTL
            if (seenUrlsWithTimestamps.has(cacheKey)) {
                return null; // Skip recently seen item              
            }
            seenUrlsWithTimestamps.set(cacheKey);

            const groqResult = await analyzeNewsWithQroq(
              item.title,
              "The Hindu",
              item?.description || ""
            );

            return { ...item, groqAnalysis: groqResult };

          } catch (error) {
            console.warn("Failure to analyze with groq...", error);
            return {
              sentiment: "unknown",
              mood: "unknown",
              summary: "",
              reasoning: "Analysis failed",
            };
          }
        })
      );

      const filteredResults = analyzedTrends.filter(result =>
        result && result.sentiment !== "unknown" && result.summary !== ""
      );

      if (filteredResults.length > 0) {
        yield filteredResults;
      }
    } catch (error) {
      console.error("Failed to parse record:", error);
    }
  }
}

