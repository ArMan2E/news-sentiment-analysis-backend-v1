import { analyzeNewsWithQroq } from "../util/sentiment-groq";
import transformThHealthData from "../util/transformRssToJson/transformThHealthRssJson";
import { CleanedNewsStruct } from "../util/transformRssToJson/transformThHealthRssJson";
import { connectAndStream } from "../lib/fluvio";
import { TTLCache } from "../util/CacheUtil";
import { TrendModel } from "../models/trendModel";

const TTL_DURATION = 10 * 60 * 1000;
const seenUrlsWithTimestamps = new TTLCache(TTL_DURATION);


// the pointer is important it signifies generator function to yield SSE
export default async function theHinduHealthNews(signal: AbortSignal) {
  // name of the topic
  const topic = "rss-th-health-topic";

  const jsonStreamRecord = await connectAndStream(topic);


  for await (const record of jsonStreamRecord) {
    if (signal.aborted) {
      console.log("Stream aborted.");
      break;
    }
    try {
      const raw = record.valueString();
      const parsedData = JSON.parse(raw);
      //console.log(parsedData);
      // parse the raw data
      //const stringified = JSON.stringify(parsedData);
      // returning object according to transform .ts ...need to stringify again
      const cleanedThHealthData = transformThHealthData(parsedData); // sending the js parsed to js obj data for transformation to js obj
      //console.log(stringified);
      const analyzedTrends = await Promise.all(
        cleanedThHealthData.news.map(async (item: CleanedNewsStruct) => {
          try {
            const cacheKey = `${item.title}+${item.newsUrl}`;
            if (seenUrlsWithTimestamps.has(cacheKey)) {
              return null;
            }
            
            seenUrlsWithTimestamps.set(cacheKey);

            // console.log("inside health endoint func")
            const groqResult = await analyzeNewsWithQroq(
              item.title,
              "The Hindu",
              item?.description || "",
            )
            return { ...item, groqAnalysis: groqResult };
          } catch (error) {
            console.warn("Failure to analyze with groq...", error);
            return null;              
          }
        })
      )
     const filteredResults = analyzedTrends.filter(Boolean);
      
      if (filteredResults.length > 0) {
        const plainResults = filteredResults.map(item => {
          JSON.parse(JSON.stringify({
            ...item,
            ...item?.groqAnalysis,
            category: "business",
          }))
        });
        try {
          await TrendModel.insertMany(plainResults, { ordered: false });
          console.log(`DB inserted ${filteredResults.length} no. of data health`);
        } catch (error) {
          console.error(`DB error while inserting ${error}`);
        }
      }
    } catch (error) {
      console.error("Failed to parse record:", error);
    }
  }
}
