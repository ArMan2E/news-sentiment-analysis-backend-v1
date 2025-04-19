import { fluvio } from "../../lib/fluvio";
import { SmartModuleType, Offset } from "@fluvio/client";
import { analyzeNewsWithQroq } from "../../util/sentiment-groq";
import transformTOIScienceData from "../../util/transformRssToJson/transformTOIScienceRssJson";
import { CleanedNews } from "../../util/transformRssToJson/transformTOIScienceRssJson";

const PARTITION = 0;
// the pointer is important it signifies generator function to yield SSE
export default async function* timesOfIndiaScienceNews() {
  // name of the topic
  const topic = "rss-toi-science-topic";

  console.log("Connecting to Fluvio...", topic);
  const client = await fluvio.connect();
  const consumer = await client.partitionConsumer(topic, PARTITION);

  const jsonStreamRecord = await consumer.streamWithConfig(Offset.FromEnd(), {
    smartmoduleType: SmartModuleType.Map,
    smartmoduleName: "fluvio/rss-json@0.1.0", // Make sure this SmartModule is registered/ present
  });

  for await (const record of jsonStreamRecord) {
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
            const groqResult = await analyzeNewsWithQroq(
              item.title,
              "Times Of India",
              item?.description || ""
            );
            return { ...item, groqAnalysis: groqResult };
          } catch (error) {
            console.warn("Failure to analyze with groq..", error);
            return {
              sentiment: "unknown",
              mood: "unknown",
              summary: "",
              reasoning: "Analysis failed",
            };
          }
        })
      );

      const filteredResults = analyzedTrends.filter(result => {
        return result && result.sentiment !== 'unknown' && result.summary !== "";
      })
      //console.log(stringified);
      if (filteredResults.length > 0) {
        yield filteredResults;
      }
    } catch (error) {
      console.error("Failed to parse record:", error);
    }
  }
}
