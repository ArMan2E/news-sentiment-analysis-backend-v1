// file: index.js
import express from "express";

const app = express();
const PORT = 8080;

app.get("/stream/news", (req, res) => {
  console.log("Inside the endpoint");
  res.send("It works!");
});

app.listen(8080,'0.0.0.0', () => {
  console.log(`✅ Server running at http://localhost:${PORT}/stream/news`);
});
