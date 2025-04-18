import economicTimeBusinessNews from "../newsCategory/economicTimeBusinessNews";
import googleTrendsNews from "../newsCategory/googleTrendsNews";
import theHinduHealthNews from "../newsCategory/theHinduHealthNews";
import theHinduTechnologyNews from "../newsCategory/theHinduTechnologyNews";
import timesOfIndiaScienceNews from "../newsCategory/timesOfIndiaScienceNews";

// req, res type
import { Request, Response } from "express";


// record is a type of K,V map generatorFunc names with [function*]
const newsCategoryMap: Record<string, () => AsyncGenerator<any>> = {
  breaking: googleTrendsNews, // func name
  business: economicTimeBusinessNews,
  science: timesOfIndiaScienceNews,
  technology: theHinduTechnologyNews,
  health: theHinduHealthNews,
};


export const newsCategory = async (req: Request, res: Response) => {
  // extract the category
  // params is stream/news/science or /technology req.params.category
  // query is new?category=science or can use comma seperated like science,technology need run parallel stream
  // req.query.category
  const category = req.params.category.toLowerCase(); // cause map's key is in lc
  console.log(`Inside the endpoint /stream/${category}`);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders(); // Flush headers immediately to client to let it know about "Content-Type"
  //let responseMsg: Promise<string | undefined>; // declare outside case block

  const streamCategoryFn = newsCategoryMap[category];
  // if category is not in the Record map then close the connection with error
  if (!streamCategoryFn) {
    res.write(`event: error\ndata" ${JSON.stringify({ error: "Invlaid category" })}`)
    res.end();
    return;
  }

  try {
    for await (const record of streamCategoryFn()) {
      // proper SSE format -> ends with \n\n double newline
      res.write(`data: ${JSON.stringify(record)}\n\n`);
      res.flush
    }

  } catch (error) {
    console.error("Failed to stream news:", error);
    res.write(
      `event: error\ndata: ${JSON.stringify({ error: "Streaming failed" })}\n\n`
    );
    res.end();
  }

  // on req closed
  req.on("close", () => {
    console.log("Client disconnected from SSE");
    res.end();
  });
};
