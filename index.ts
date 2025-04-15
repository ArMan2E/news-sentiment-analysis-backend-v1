import Express from "express";
import cors from "cors";
import { Offset, SmartModuleType } from "@fluvio/client";
import { fluvio, fluvioClient } from "./lib/fluvio";
import transformTrendData from "./util/transformRssToJson/transformGoogleRSSJson.ts";
import { analyzeNewsWithQroq } from "./util/sentiment-groq.ts";
import googleTrendsNews from "./src/newsCategory/googleTrendsNews.ts";
import economicTimeBusinessNews from "./src/newsCategory/economicTimeBusinessNews.ts";
import timesOfIndiaScienceNews from "./src/newsCategory/timesOfIndiaScienceNews.ts";
import timesOfIndiaTechnologyNews from "./src/newsCategory/theHinduTechnologyNews.ts";
import theHinduTechnologyNews from "./src/newsCategory/theHinduTechnologyNews.ts";
import theHinduHealthNews from "./src/newsCategory/theHinduHealthNews.ts";
import newsCategoryRouter from "./src/routes/newsCategoryRoute.ts";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection", reason);
});
const PORT: number = Number(process.env.PORT) || 8080; // convert to number as .env is of type string, Number() is a constructor
const HOST = process.env.HOST_NAME || "0.0.0.0";

const app = Express();

app.use(
  cors({
    origin: "*",
  })
);

/**
 * End point /stream/news/:category
 *  category -> case or if else?? using Map in ts that is Record of <string, () => AsyncGenerator<any>> as using SSE with yield
 *  string type is the name of category breaking, science, tech, health
 *  BREAKING -> consume from rss-google-trends-topic in src/breaking.ts -> move the try catch block and just return the reponse from there
 *  
 *
 */
// app.get("/stream/:news", async (req, res) => {
//   console.log("Inside the endpoint /stream/news");

//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Connection", "keep-alive");
//   res.setHeader("X-Accel-Buffering", "no");
//   res.flushHeaders(); // Flush headers immediately to client to let it know about "Content-Type"
//   //let responseMsg: Promise<string | undefined>; // declare outside case block
//   try {
//     //responseMsg = await googleTrendsNews(); // again stringify


//     for await (const record of googleTrendsNews()) {
//       res.write(`data: ${JSON.stringify(record)}\n\n`);
//     }

//     for await (const record of economicTimeBusinessNews()) {
//       res.write(`data: ${JSON.stringify(record)}\n\n`);
//     }

//     // for await (const record of timesOfIndiaScienceNews()) {
//     //   console.log(JSON.stringify(record));
//     //   // each event must end with \n\n double newline
//     //   res.write(`data: ${JSON.stringify(record)}\n\n`);
//     // }
//     // for await (const record of theHinduTechnologyNews()) {
//     //   console.log(JSON.stringify(record));
//     //   // each event must end with \n\n double newline
//     //   res.write(`data: ${JSON.stringify(record)}\n\n`);
//     // }
//     // for await (const record of theHinduHealthNews()) {
//     //   console.log(JSON.stringify(record));
//     //   // each event must end with \n\n double newline
//     //   res.write(`data: ${JSON.stringify(record)}\n\n`);
//     // }

//     //res.write(responseMsg); // write to response
//     req.on("close", () => {
//       console.log("Client disconnected from SSE");
//       res.end();
//     });
//   } catch (error) {
//     console.error("Failed to stream news:", error);
//     res.write(
//       `event: error\ndata: ${JSON.stringify({ error: "Streaming failed" })}\n\n`
//     );
//     res.end();
//   }
// });

app.use("/stream/news", newsCategoryRouter);
// test endpoint
app.get("/ping", (_, res) => {
  console.log("Ping route hit !!");
  res.send("pong");
});

// if bun is not running after server running... error -> change port
app.listen(PORT, HOST, () => {
  console.log(`Server running...`);
});
