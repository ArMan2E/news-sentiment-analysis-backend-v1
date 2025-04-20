import crypto from "crypto";
import NewsHash from "../src/models/newsHash";

export function generateNewsHash(title: string, headlines: string[]): string {
	const combined = title + headlines.join(" ");
	return crypto.createHash("sha256").update(combined).digest("hex");
}

async function checkForExistingHashes(hashes: string[]) {
	const existingHashes = await NewsHash.find({ hash: { $in: hashes } }).select("hash");
	return new Set(existingHashes.map((doc: any) => doc.hash));
}
