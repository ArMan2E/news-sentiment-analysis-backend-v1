import mongoose from "mongoose";

const newsItemSchema = new mongoose.Schema({
	title: String,
	url: String,
	source: String,
	image: String,
}, { _id: false });

const trendSchema = new mongoose.Schema({
	title: { type: String, required: true },
	link: { type: String },
	pubDate: { type: Date },
	approxTraffic: { type: String },
	news: [newsItemSchema],
	language: { type: String },

	// Groq Analysis test for now gorq analysis is common 
	// for different vendors might common out
	symmary: { type: String },
	sentiment: { type: String },
	mood: { type: String },
	bias_level: { type: String },
	bias_direction: { type: String },
	subjectivity: { type: Number },
	indicators: [String],
	reasoning: { type: String },
	category: { type: String, index: true }, // to query by category 

	// for query or cache ??
	createdAt: {
		type: Date,
		default: Date.now(),
		index: true
	}
})	

// constraints -> unique index with title and pubDate
// sometime title is same but pubDate is diff 
trendSchema.index({title: 1, pubDate: 1, news: 1}, {unique: true});

export const TrendModel = mongoose.model('TrendNews', trendSchema);