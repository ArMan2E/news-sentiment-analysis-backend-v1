import economicTimeBusinessNews from "../newsCategory/googleTrendsNews";
import googleTrendsNews from "../newsCategory/googleTrendsNews";
import theHinduHealthNews from "../newsCategory/theHinduHealthNews";
import theHinduTechnologyNews from "../newsCategory/theHinduTechnologyNews";
import timesOfIndiaScienceNews from "../newsCategory/timesOfIndiaScienceNews";
import { TrendModel } from "../models/trendModel";
// import generateHash from "./genHash.ts";
import cron from "node-cron";

// record is a type of K,V map generatorFunc names with [function*]
const newsCategoryMap: Record<string, (signal: AbortSignal) => Promise<void>> = {
	breaking: googleTrendsNews, // func name
	// business: economicTimeBusinessNews,
	// science: timesOfIndiaScienceNews,
	// technology: theHinduTechnologyNews,
	// health: theHinduHealthNews,
};
// 15 mins like jenkis 
console.log("Will start cron job")
//working fine for 2min setup
const saveNewsToDbJob = cron.schedule("*/15 * * * * * ", async () => {
	console.log("Cron job started news ingestion job");
	const controller = new AbortController();
	const { signal } = controller;
	for (const [category, newsIngestionFunc] of Object.entries(newsCategoryMap)) {
		try {
			await newsIngestionFunc(signal);
			console.log("Finished corn for ", category);
		} catch (error) {
			console.log(`Error in category ${category}, ${error}`);
		}
	}
	console.log("News collection completed ");
},{
	scheduled: true // automatically runs
})
saveNewsToDbJob.start();
export default saveNewsToDbJob;