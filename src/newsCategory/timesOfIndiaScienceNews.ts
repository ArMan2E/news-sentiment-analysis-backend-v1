import { analyzeNewsWithQroq } from "../util/sentiment-groq";
import transformTOIScienceData from "../util/transformRssToJson/transformTOIScienceRssJson";
import { CleanedNews } from "../util/transformRssToJson/transformTOIScienceRssJson";
import { connectAndStream } from "../lib/fluvio";
import { TTLCache } from "../util/CacheUtil";
import { TrendModel } from "../models/trendModel";

// the pointer is important it signifies generator function to yield SSE
// abort signal to stop if client disconnects
const TTL_DURATION = 10 * 60 * 1000;
const seenUrlsWithTimestamps = new TTLCache(TTL_DURATION);
export default async function timesOfIndiaScienceNews(signal: AbortSignal) {
  // name of the topic
  const topic = "rss-toi-science-topic";
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
      const cleanedTOIScienceData = transformTOIScienceData(parsedData); // sending the js parsed to js obj data for transformation to js obj
      const analyzedTrends = await Promise.all(
        // news is the key of array of news of type CleanedNews
        cleanedTOIScienceData.news.map(async (item: CleanedNews) => {
          try {
            const cacheKey = `${item.newsUrl}+${item.title}`;

            // Check if the news item is still within TTL
            if (seenUrlsWithTimestamps.has(cacheKey)) {
              return null; // Skip recently seen item              
            }

            seenUrlsWithTimestamps.set(cacheKey);

            const groqResult = await analyzeNewsWithQroq(
              item.title,
              "Times Of India",
              item?.description || ""
            );
            return { ...item, groqAnalysis: groqResult };
          } catch (error) {
            console.warn("Failure to analyze with groq..", error);
            return null;
          }
        })
      );

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
          console.log(`DB inserted ${filteredResults.length} no. of data science`);
        } catch (error) {
          console.error(`DB error while inserting ${error}`);
        }
      }
    } catch (error) {
      console.error("Failed to parse record:", error);
    }
  }
}
