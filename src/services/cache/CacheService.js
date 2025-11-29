/**
 * CacheService - IndexedDB-based caching with TTL support
 * Optimizes performance by caching artist metadata, album covers, and search results
 */

class CacheService {
    constructor() {
        this.dbName = 'SpotifyCloneCache';
        this.version = 1;
        this.db = null;

        // Cache stores
        this.stores = {
            artists: { name: 'artists', ttl: 24 * 60 * 60 * 1000 }, // 24 hours
            albums: { name: 'albums', ttl: 24 * 60 * 60 * 1000 }, // 24 hours
            images: { name: 'images', ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 days
            searches: { name: 'searches', ttl: 60 * 60 * 1000 } // 1 hour
        };

        // In-memory LRU cache for hot data
        this.memoryCache = new Map();
        this.maxMemoryCacheSize = 100;
    }

    /**
     * Initialize IndexedDB
     */
    async init() {
        if (typeof window === 'undefined' || !window.indexedDB) {
            console.warn('[CacheService] IndexedDB not available');
            return false;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                console.log('[CacheService] Database initialized');
                resolve(true);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                Object.values(this.stores).forEach(store => {
                    if (!db.objectStoreNames.contains(store.name)) {
                        const objectStore = db.createObjectStore(store.name, { keyPath: 'key' });
                        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                        console.log(`[CacheService] Created store: ${store.name}`);
                    }
                });
            };
        });
    }

    /**
     * Get item from cache (checks memory cache first, then IndexedDB)
     */
    async get(storeName, key) {
        // Check memory cache first
        const memKey = `${storeName}:${key}`;
        if (this.memoryCache.has(memKey)) {
            const cached = this.memoryCache.get(memKey);
            if (Date.now() - cached.timestamp < this.stores[storeName].ttl) {
                return cached.data;
            } else {
                this.memoryCache.delete(memKey);
            }
        }

        // Check IndexedDB
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result;
                if (!result) {
                    resolve(null);
                    return;
                }

                // Check if expired
                const age = Date.now() - result.timestamp;
                if (age > this.stores[storeName].ttl) {
                    // Expired - delete and return null
                    this.delete(storeName, key);
                    resolve(null);
                    return;
                }

                // Add to memory cache
                this.addToMemoryCache(memKey, result.data, result.timestamp);
                resolve(result.data);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Set item in cache (both memory and IndexedDB)
     */
    async set(storeName, key, data) {
        const timestamp = Date.now();
        const memKey = `${storeName}:${key}`;

        // Add to memory cache
        this.addToMemoryCache(memKey, data, timestamp);

        // Add to IndexedDB
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put({ key, data, timestamp });

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete item from cache
     */
    async delete(storeName, key) {
        const memKey = `${storeName}:${key}`;
        this.memoryCache.delete(memKey);

        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear entire store
     */
    async clear(storeName) {
        // Clear memory cache for this store
        for (const key of this.memoryCache.keys()) {
            if (key.startsWith(`${storeName}:`)) {
                this.memoryCache.delete(key);
            }
        }

        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Add to memory cache with LRU eviction
     */
    addToMemoryCache(key, data, timestamp) {
        // LRU: delete oldest if at capacity
        if (this.memoryCache.size >= this.maxMemoryCacheSize) {
            const firstKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(firstKey);
        }

        this.memoryCache.set(key, { data, timestamp });
    }

    /**
     * Get cache statistics
     */
    async getStats() {
        if (!this.db) await this.init();

        const stats = {};
        for (const storeName of Object.keys(this.stores)) {
            const count = await this.getStoreCount(storeName);
            stats[storeName] = count;
        }
        stats.memoryCache = this.memoryCache.size;
        return stats;
    }

    /**
     * Get count of items in store
     */
    async getStoreCount(storeName) {
        if (!this.db) return 0;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all expired entries (garbage collection)
     */
    async garbageCollect() {
        if (!this.db) return;

        for (const [storeName, config] of Object.entries(this.stores)) {
            const expired = [];
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.openCursor();

            await new Promise((resolve) => {
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        const age = Date.now() - cursor.value.timestamp;
                        if (age > config.ttl) {
                            expired.push(cursor.value.key);
                        }
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };
            });

            // Delete expired entries
            for (const key of expired) {
                await this.delete(storeName, key);
            }

            console.log(`[CacheService] Garbage collected ${expired.length} items from ${storeName}`);
        }
    }
}

// Singleton instance
const cacheService = new CacheService();

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
    cacheService.init().catch(err => {
        console.error('[CacheService] Initialization failed:', err);
    });

    // Run garbage collection every hour
    setInterval(() => {
        cacheService.garbageCollect();
    }, 60 * 60 * 1000);
}

export default cacheService;
