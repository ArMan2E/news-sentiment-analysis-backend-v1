import Express from "express";
import cors from "cors";
import saveNewsToDb from "./src/util/cron-job"
// import newsCategoryRouter from "./src/routes/newsCategoryRoute.ts";
import connectDb from "./src/database/dbConnect";
import newsCategoryFromDbRouter from "./src/routes/newsFromDbRoute";
import groqChatBotRoute from "./src/routes/groqChatBot";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection", reason);
});
const PORT: number = Number(process.env.PORT) || 8080; // convert to number as .env is of type string, Number() is a constructor
const HOST = process.env.HOST_NAME || "0.0.0.0";

const app = Express();

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"], // Default to self (same origin)
      connectSrc: ["'self'", "http://localhost:8080"], // Allow connecting to localhost:8080
      imgSrc: ["'self'", "data:", "blob:"], // Allow images from self, data, and blob URIs
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"], // Allow inline scripts and scripts from a CDN
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"], // Allow inline styles and styles from Google Fonts
      fontSrc: ["'self'", "https://fonts.gstatic.com"], // Allow fonts from self and Google Fonts
      objectSrc: ["'none'"], // Disallow embedding objects, applets, and plugins
      frameAncestors: ["'none'"], // Disallow the page from being embedded in frames or iframes
      formAction: ["'self'"], // Only allow forms to be submitted to the same origin
      upgradeInsecureRequests: [], // Automatically upgrade HTTP requests to HTTPS
    },
  })
);



const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
})

app.use(limiter);

// no need for cors cause same port
// app.use(
//   cors({
//     origin: "*",
//     methods: ["POST", "GET"]
//   })
// );
//for cjs
async function start() {
  await connectDb(); // connect to DB
  // other logic
}
start();


app.use("/news", newsCategoryFromDbRouter);
// test endpoint
app.get("/ping", (_, res) => {
  console.log("Ping route hit !!");
  res.send("pong");
});
app.use("/api", groqChatBotRoute)

app.use(Express.static('./public'));
app.get("*", (_, res) => {
  res.sendFile('index.html', {root: 'public'});
});
//corn job
saveNewsToDb.start();
// if bun is not running after server running... error -> change port
app.listen(PORT, HOST, () => {
  console.log(`Server running... on port-> ${PORT} and host ${HOST}`);
});

