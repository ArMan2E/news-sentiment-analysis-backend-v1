import mongoose from "mongoose";

const newsHashSchema = new mongoose.Schema({
	hash: { type: String, required: true, unique: true },
	timestamp: { type: Date, default: Date.now },
});
newsHashSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

const NewsHash = mongoose.model("NewsHash", newsHashSchema);
export default NewsHash;
