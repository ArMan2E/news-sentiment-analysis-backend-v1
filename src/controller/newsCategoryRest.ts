import { TrendModel } from "../models/trendModel";

// req, res type
import { Request, Response } from "express";

export async function getNewsByCategory(req: Request, res: Response): Promise<Response> {

	const category = req.params.category?.toLowerCase();
	console.log(`Inside the endpoint /news/${category}`);

	if (!category) {
		return res.status(400).json({ error: "Category is required in the Req URL" });		
	}
	try {
		// takes from MongoDb route
		const news = await TrendModel.find({ category })
			.sort({ pubDate: -1 }) // sort by Most recent first
			.limit(20); // Limit to latest 20 news as required might use for pagination
		if (!news.length) {
			return res.status(404).json({ message: `No news found for category ${category}` });
		}
		 return res.status(200).json(news); // success 
	} catch (error) {
		console.error("Error fetching news from mongoDb: ", error);
		return res.status(500).json({ error: "Failed to fetch news" });
	}
}
