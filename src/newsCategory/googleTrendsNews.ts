import { fluvio } from "../../lib/fluvio";
import { SmartModuleType, Offset } from "@fluvio/client";
import transformTrendData from "../../util/transformRssToJson/transformGoogleRSSJson";
import { analyzeNewsWithQroq } from "../../util/sentiment-groq";
const PARTITION = 0;

// no try scatch !!!!
export default async function* googleTrendsNews() {
  const topic = "rss-google-trends-topic";
  console.log("Connecting to Fluvio...");
  const client = await fluvio.connect();
  const consumer = await client.partitionConsumer(topic, PARTITION);

  const jsonStreamRecord = await consumer.streamWithConfig(Offset.FromEnd(), {
    smartmoduleType: SmartModuleType.Map,
    smartmoduleName: "fluvio/rss-json@0.1.0", // Make sure this SmartModule is registered/ present
  });

  for await (const record of jsonStreamRecord) {
    const raw = record.valueString();
    const parsedData = JSON.parse(raw); // parse the raw data
    // transform the data !!
    // .items is an array in the parsedData which contains the actual links and data it is mapped then
    const cleanedData = parsedData.items.map(transformTrendData);

    //const responseMsg = `data: ${JSON.stringify(cleanedData)}\n\n`; // again stringify

    /**
     * GROQ works ???
     */
    const analyzedTrends = await Promise.all(
      cleanedData.map(async (item: any) => {
        try {
          // const firstNews =
          //   item.news[0].title + item.news[1].title + item.news[2].title;
          // add first three title of news array
          const firstNews = item.news
            .slice(0, 3)
            .map((n: any) => n.title)
            .join(" ");

          const groqResult = await analyzeNewsWithQroq(
            item.title,
            item?.source || "Unknown",
            firstNews || ""
          );
          // analyzes each titles -> more api call !!!!!! unnecssary
          // const groqResult = await Promise.all(
          //   allNews.map(async (newsItem: any) => {
          //     return await analyzeNewsWithQroq(
          //       item.title,
          //       newsItem.title || ""
          //     );
          //   })
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
    //const responseMsg = `data: ${JSON.stringify(analyzedTrends)}\n\n`;
    yield analyzedTrends;
  }
}
