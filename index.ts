import Express from "express";
import cors from "cors";
import { Offset, SmartModuleType } from "@fluvio/client";
import { fluvio, fluvioClient } from "./lib/fluvio";
import transformTrendData from "./lib/transformJson";
import { analyzeNewsWithQroq } from "./sentiment-groq.ts";
import { INSPECT_MAX_BYTES } from "buffer";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection", reason);
});
const PORT = process.env.PORT || 8080;
const PARTITION = 0;
const app = Express();
app.use(
  cors({
    origin: "*",
  })
);

app.use(cors());

app.get("/stream/news", async (req, res) => {
  console.log("Inside the endpoint /stream/news");

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders(); // Flush headers immediately

  try {
    const topic = "google-trends-rss-topic";
    console.log("Connecting to Fluvio...");
    const client = await fluvio.connect();
    const consumer = await client.partitionConsumer(topic, PARTITION);

    const jsonStreamRecord = await consumer.streamWithConfig(Offset.FromEnd(), {
      smartmoduleType: SmartModuleType.Map,
      smartmoduleName: "fluvio/rss-json@0.1.0", // Make sure this SmartModule is registered
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
      const responseMsg = `data: ${JSON.stringify(analyzedTrends)}\n\n`; // again stringify

      console.log("Sending record:");
      res.write(responseMsg); // write to response
    }

    req.on("close", () => {
      console.log("Client disconnected from SSE");
      res.end();
    });
  } catch (error) {
    console.error("Failed to stream news:", error);
    res.status(500).json({ error: "Failed to stream news." });
  }
});

app.get("/ping", (_, res) => {
  console.log("Ping route hit !!");
  res.send("pong");
});

// if bun is not running after server running... error -> change port
app.listen(8083, "0.0.0.0", () => {
  console.log(`Server running...`);
});
