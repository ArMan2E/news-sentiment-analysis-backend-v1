import { fluvio } from "../../lib/fluvio";
import { SmartModuleType, Offset } from "@fluvio/client";
import { analyzeNewsWithQroq } from "../../util/sentiment-groq";
import transformTOIScienceData from "../../util/transformRssToJson/transformTOIScienceRssJson";
import transformThHealthData from "../../util/transformRssToJson/transformThHealthRssJson";
import { CleanedNewsStruct } from "../../util/transformRssToJson/transformThHealthRssJson";
const PARTITION = 0;
// the pointer is important it signifies generator function to yield SSE
export default async function* theHinduHealthNews() {
  // name of the topic
  const topic = "rss-th-health-topic";

  console.log("Connecting to Fluvio...", topic);
  const client = await fluvio.connect();
  const consumer = await client.partitionConsumer(topic, PARTITION);

  const jsonStreamRecord = await consumer.streamWithConfig(Offset.FromEnd(), {
    smartmoduleType: SmartModuleType.Map,
    smartmoduleName: "fluvio/rss-json@0.1.0", // Make sure this SmartModule is registered/ present
  });

  const seenUrls = new Set();
  for await (const record of jsonStreamRecord) {
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
            if (seenUrls.has(cacheKey)) {
              return null;
            }
            seenUrls.add(cacheKey);
            const groqResult = await analyzeNewsWithQroq(
              item.title,
              "The Hindu",
              item?.description || "",
            )
            return { ...item, groqAnalysis: groqResult };
          } catch (error) {
            console.warn("Failure to analyze with groq...", error);
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
     // const filteredResults = analyzedTrends.filter(Boolean);
      const filteredResults = analyzedTrends.filter(result => {
        return result && result.sentiment !== 'unknown' && result.summary !== "";
      })
      if (filteredResults.length > 0) {
        yield filteredResults;
      }
    } catch (error) {
      console.error("Failed to parse record:", error);
    }
  }
}
