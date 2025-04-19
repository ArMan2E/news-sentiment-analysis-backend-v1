import { connectAndStream, fluvio } from "../../lib/fluvio";
import { SmartModuleType, Offset } from "@fluvio/client";
import transformTrendData from "../../util/transformRssToJson/transformGoogleRSSJson";
import { analyzeNewsWithQroq } from "../../util/sentiment-groq";
import { TTLCache } from "../../util/CacheUtil";
const PARTITION = 0;

const TTL_DURATION = 10 * 60 * 1000;

const seenUrlsWithTimestamps = new TTLCache(TTL_DURATION);

// no try scatch !!!!
export default async function* googleTrendsNews(signal: AbortSignal) {
  const topic = "rss-google-trends-topic";

  const jsonStreamRecord = await connectAndStream(topic);
  for await (const record of jsonStreamRecord) {
    if (signal.aborted) {
      console.log("Stream aborted.");
      break;
    }
    const raw = record.valueString();
    const parsedData = JSON.parse(raw); // parse the raw data
    // transform the data !!
    // .items is an array in the parsedData which contains the actual links and data it is mapped then
    const cleanedData = parsedData.items.map(transformTrendData);
    
    const analyzedTrends = await Promise.all(
      cleanedData.map(async (item: any) => {
        try {
          // add first three title of news array
          const firstNews = item.news
            .slice(0, 3)
            .map((n: any) => n.title)
            .join(" ");
          const cacheKey = `${item.title}+${firstNews}`;
          if (seenUrlsWithTimestamps.has(cacheKey)) {
            console.log(`skipping duplicate trend ${item.title}`);
            return null;// skip analysis
          }
          seenUrlsWithTimestamps.set(cacheKey);

          const groqResult = await analyzeNewsWithQroq(
            item.title,
            item?.source || "Unknown",
            firstNews || ""
          );
          return { ...item, groqAnalysis: groqResult }; // return item yes to get the links and the source???
          //return { ...groqResult }; // return item ???
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

    //-------------------
    // filter out nulls
    //const filteredResults = analyzedTrends.filter(Boolean);
    const filteredResults = analyzedTrends.filter(result => {
      return result && result.sentiment !== 'unknown' && result.summary !== "";
    })
    if (filteredResults.length > 0) {
      yield filteredResults;
    }
  }
}
