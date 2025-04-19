import { connectAndStream } from "../../lib/fluvio";
import { analyzeNewsWithQroq } from "../../util/sentiment-groq";
import transformETBusinessData from "../../util/transformRssToJson/transformETBusinessRSSJson";
import { CleanedNews } from "../../util/transformRssToJson/transformETBusinessRSSJson";
import { TTLCache } from "../../util/CacheUtil";
const TTL_DURATION = 10 * 60 * 1000;

const seenUrlsWithTimestamps = new TTLCache(TTL_DURATION);

// the pointer is important it signifies generator function to yield SSE

export default async function* economicTimeBusinessNews(signal: AbortSignal) {
  const topic = "rss-et-business-topic";
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
      //console.log(`Data ${JSON.stringify(parsedData)}`)
      // returning object according to transform .ts ...need to stringify again
      const cleanedETBusinessData = transformETBusinessData(parsedData);

      const analyzedTrends = await Promise.all(

        cleanedETBusinessData.news.map(async (item: CleanedNews) => {
          try {
            const cacheKey = `${item.newsUrl}+${item.title}`;
            if (seenUrlsWithTimestamps.has(cacheKey)) {
              //console.log(`skipping duplicate news ${item.title}`);
              return null;// skipp analysis dontuse continue cause inside map() use return null;              
            }
            seenUrlsWithTimestamps.set(cacheKey);

            const groqResult = await analyzeNewsWithQroq(
              item.title,
              "Economic Times",
              item?.description || ""
            );
            return { ...item, groqAnalysis: groqResult }
          } catch (error) {
            console.warn(`Failure to analyze with groq... ${error} \n for news ${item.title}`);
            //console.log(item.description);
            return {
              sentiment: "unknown",
              mood: "unknown",
              summary: "",
              reasoning: `Analysis failed for news ${item.description} because ${error}`,
            }
          }
        })
      )
      //console.log(analyzedTrends);
      //const filteredResults = analyzedTrends.filter(Boolean);
      const filteredResults = analyzedTrends.filter(result => {
        return result && result.sentiment !== 'unknown' && result.summary !== "";
      })
      if (filteredResults.length > 0) {
        yield filteredResults;
      }
      //yield analyzedTrends;
    } catch (error) {
      console.error("Failed to parse record:", error);
    }
  }
}
