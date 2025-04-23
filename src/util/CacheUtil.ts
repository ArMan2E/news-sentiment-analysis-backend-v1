type TTLCacheEntry = {
	timestamp: number;
};
// use map for cache checking !! set to not store duplicate
export class TTLCache {
	private cache: Map<string, TTLCacheEntry>;
	// passed as arg to constructor
	private ttl: number; // Time to live in milliseconds

	constructor(ttlDuration: number) {
		this.cache = new Map();
		this.ttl = ttlDuration;
	}

	// returns boolean takes string
	has(key: string): boolean {
		const entry = this.cache.get(key);
		if (!entry) return false;
		// compare time remaining
		const now = Date.now();
		if (now - entry.timestamp > this.ttl) {
			this.cache.delete(key); // for this instance
			return false;
		}
		return true;
	}

	// wrapper over .set with value timestamp
	// unique key is the url+title
	set(key: string): void {
		this.cache.set(key, { timestamp: Date.now() });
	}


	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > this.ttl) {
				this.cache.delete(key);
			}
		}
	}

	size(): number {
		return this.cache.size;
	}

	clear(): void {
		this.cache.clear();
	}
}
