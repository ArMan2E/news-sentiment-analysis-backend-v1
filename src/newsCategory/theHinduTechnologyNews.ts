import { fluvio } from "../../lib/fluvio";
import { SmartModuleType, Offset } from "@fluvio/client";
import { analyzeNewsWithQroq } from "../../util/sentiment-groq";
import transformTOIScienceData from "../../util/transformRssToJson/transformTOIScienceRssJson";
import transformThTechnologyData from "../../util/transformRssToJson/transformThTechnologyRSSJson";
const PARTITION = 0;
// the pointer is important it signifies generator function to yield SSE
export default async function* theHinduTechnologyNews() {
  // name of the topic
  const topic = "rss-th-technology-topic";

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
      const cleanedThTechnologyData = transformThTechnologyData(parsedData); // sending the js parsed to js obj data for transformation to js obj
      //console.log(stringified);
      yield cleanedThTechnologyData;
    } catch (error) {
      console.error("Failed to parse record:", error);
    }
  }
}
