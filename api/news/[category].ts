// api/news/[category].js
import mongoose from 'mongoose';
import {TrendModel} from "../../src/models/trendModel"// adjust path if needed
import _ from "dotenv/config"
// Re‑use the same Mongo connection across invocations
let cached = global.mongoose;
if (!cached) {
	cached = global.mongoose = { conn: null, promise: null };
}
const MONGO_URI = process.env.MONGO_URI!; // ! -> guarantee ts MONGO_URI is defined 
// possibility of error can be typed to undefined ??? prob cause of .env ???
async function dbConnect() {
	if (cached.conn) return cached.conn;
	if (!cached.promise) {
		cached.promise = mongoose.connect(MONGO_URI, {
			dbName: 'newsdb',
			bufferCommands: false,
		}).then((m) => m.connection);
	}
	cached.conn = await cached.promise;
	return cached.conn;
}

export default async function handler(req, res) {
	const { category } = req.query;
	if (!category)
		return res.status(400).json({ error: 'Category is required in the URL' });

	try {
		await dbConnect();
		const docs = await TrendModel.find({ category: category.toLowerCase() })
			.sort({ pubDate: -1 })
			.limit(20)
			.lean();

		if (!docs.length)
			return res.status(404).json({ message: `No news for ${category}` });

		return res.status(200).json(docs);
	} catch (err) {
		console.error('News fetch error:', err);
		return res.status(500).json({ error: 'Failed to fetch news' });
	}
}
