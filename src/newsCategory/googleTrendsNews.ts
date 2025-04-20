import { connectAndStream, fluvio } from "../../lib/fluvio";
import transformTrendData from "../../util/transformRssToJson/transformGoogleRSSJson";
import { analyzeNewsWithQroq } from "../../util/sentiment-groq";
import { TTLCache } from "../../util/CacheUtil";
import { TrendModel } from "../models/trendModel";
import {generateNewsHash} from "../../util/genHash"
import corn from "node-cron";

const TTL_DURATION = 10 * 60 * 1000;
type NewsItem = {
  title: string;
  news: { title: string }[]; // Each news object contains a title
};
const seenUrlsWithTimestamps = new TTLCache(TTL_DURATION);

// no try scatch !!!!
export default async function googleTrendsNews(signal: AbortSignal) {
  const topic = "rss-google-trends-topic";

  const jsonStreamRecord = await connectAndStream(topic);
  const batchSize = 100;// size for query and insert op
  const hashToInsert = [];
  const currentBatchHashes = new Set<String>();

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
          console.log("Sent for analyzing")
          const groqResult = await analyzeNewsWithQroq(
            item.title,
            item?.source || "Unknown",
            firstNews || ""
          );
          console.log("Groq Result ", groqResult);
          console.log("Done analyzing");

          return { ...item, groqAnalysis: groqResult }; // return item yes to get the links and the source
        } catch (error) {
          console.warn("Failure to analyze with groq...", error);
          return null;
        }
      })
    );

    //-------------------
    //filter out nulls
    const filteredResults = analyzedTrends.filter(Boolean);
    if (filteredResults.length > 0) {
      const plainResults = filteredResults.map(item =>
        JSON.parse(JSON.stringify({
          ...item,
          ...item.groqAnalysis, // flatten the groq analysis according to the model
          category: "breaking",
        }))
      );
      try {
        await TrendModel.insertMany(plainResults , { ordered: false });
        console.log(`DB inserted ${filteredResults.length} no. of data`);
      } catch (error) {
        console.error(`DB error while inserting ${error}`);
      }
    }
  }
}
