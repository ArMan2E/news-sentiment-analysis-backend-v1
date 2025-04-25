import Express from "express";
import cors from "cors";
import saveNewsToDb from "./src/util/cron-job"
// import newsCategoryRouter from "./src/routes/newsCategoryRoute.ts";
import connectDb from "./src/database/dbConnect";
import newsCategoryFromDbRouter from "./src/routes/newsFromDbRoute";
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
await connectDb(); // conn to db
//app.use(compression());

app.use("/news", newsCategoryFromDbRouter);
// test endpoint
app.get("/ping", (_, res) => {
  console.log("Ping route hit !!");
  res.send("pong");
});
//corn job
saveNewsToDb.start();
// if bun is not running after server running... error -> change port
app.listen(PORT, HOST, () => {
  console.log(`Server running... on port-> ${PORT}`);
});

