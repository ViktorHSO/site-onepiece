/**
 * Image Service for One Piece Encyclopedia
 * Handles image loading with fallbacks, caching, and lazy loading
 */

const ImageService = {
    // Image mappings from One Piece Wiki/Fandom
    mappings: typeof ImageMappings !== 'undefined' ? ImageMappings : { characters: {}, fruits: {}, swords: {}, crews: {} },
    // Configuration
    config: {
        defaultWidth: 400,
        defaultHeight: 400,
        quality: 90,
        cachePrefix: 'op_img_',
        cacheExpiry: 86400000, // 24 hours in milliseconds
        maxRetries: 3,
        retryDelay: 1000
    },

    // Image cache (in-memory)
    cache: new Map(),
    failedUrls: new Set(),

    // Placeholder images
    placeholders: {
        character: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzBhMTQyMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWRiOGQ0IiBmb250LXNpemU9IjE4IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+UGVyc29uYWdlbTwvdGV4dD48L3N2Zz4=',
        fruit: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzBhMTQyMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWRiOGQ0IiBmb250LXNpemU9IjE4IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+RnJ1dGE8L3RleHQ+PC9zdmc+',
        crew: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzBhMTQyMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWRiOGQ0IiBmb250LXNpemU9IjE4IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+VHJpcHVsYcOnw6NvPC90ZXh0Pjwvc3ZnPg==',
        sword: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzBhMTQyMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWRiOGQ0IiBmb250LXNpemU9IjE4IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+RXNwYWRhPC90ZXh0Pjwvc3ZnPg==',
        default: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzBhMTQyMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWRiOGQ0IiBmb250LXNpemU9IjE4IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+SW1hZ2UgTm8gQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg=='
    },

    /**
     * Get placeholder image for type
     */
    getPlaceholder(type = 'default') {
        return this.placeholders[type] || this.placeholders.default;
    },

    /**
     * Validate URL
     */
    isValidUrl(url) {
        if (!url || typeof url !== 'string') return false;
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Generate fallback URLs for a character/fruit/crew
     */
    generateFallbackUrls(entity, type) {
        const urls = [];
        const name = entity.name || '';
        const id = entity.id || '';

        // Primary: API image if available (most reliable)
        if (entity.image && this.isValidUrl(entity.image)) {
            urls.push(entity.image);
        }

        // Secondary: Check mappings (One Piece Wiki/Fandom real images)
        const mappingType = type === 'character' ? 'characters' : 
                           type === 'fruit' ? 'fruits' : 
                           type === 'sword' ? 'swords' : 'crews';
        
        if (this.mappings[mappingType] && this.mappings[mappingType][name]) {
            urls.push(this.mappings[mappingType][name]);
        }

        // Tertiary: One Piece Wiki/Fandom (using name-based URLs)
        const sanitizedName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        if (sanitizedName) {
            // One Piece Wiki
            urls.push(`https://onepiece.fandom.com/wiki/${sanitizedName}?action=render`);
            
            // Alternative wiki sources
            urls.push(`https://onepiece.fandom.com/wiki/File:${sanitizedName}.png`);
        }

        // Quaternary: Generic placeholder based on type
        urls.push(this.getPlaceholder(type));

        return urls;
    },

    /**
     * Check if URL is in cache
     */
    isCached(url) {
        const cacheKey = this.config.cachePrefix + btoa(url);
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            try {
                const data = JSON.parse(cached);
                // Check if cache is still valid
                if (Date.now() - data.timestamp < this.config.cacheExpiry) {
                    return data.imageUrl;
                } else {
                    // Cache expired, remove it
                    localStorage.removeItem(cacheKey);
                }
            } catch (e) {
                localStorage.removeItem(cacheKey);
            }
        }
        return null;
    },

    /**
     * Cache a successful URL
     */
    cacheUrl(originalUrl, successfulUrl) {
        try {
            const cacheKey = this.config.cachePrefix + btoa(originalUrl);
            const data = {
                imageUrl: successfulUrl,
                timestamp: Date.now()
            };
            localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
            console.warn('[ImageService] Failed to cache URL:', e);
        }
    },

    /**
     * Mark URL as failed
     */
    markAsFailed(url) {
        this.failedUrls.add(url);
    },

    /**
     * Check if URL has failed before
     */
    hasFailed(url) {
        return this.failedUrls.has(url);
    },

    /**
     * Preload an image with fallbacks
     */
    async preloadImage(urls, retryCount = 0) {
        for (const url of urls) {
            // Skip if this URL has failed before
            if (this.hasFailed(url)) {
                continue;
            }

            // Check cache first
            const cachedUrl = this.isCached(url);
            if (cachedUrl) {
                return cachedUrl;
            }

            // Try to load the image
            try {
                const imageUrl = await this.loadImage(url);
                this.cacheUrl(urls[0], imageUrl); // Cache with original URL as key
                return imageUrl;
            } catch (error) {
                console.warn(`[ImageService] Failed to load image: ${url}`, error);
                this.markAsFailed(url);
                continue;
            }
        }

        // All URLs failed, return placeholder
        return this.getPlaceholder('default');
    },

    /**
     * Load a single image
     */
    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // Check if image loaded successfully (not 0x0)
                if (img.width > 0 && img.height > 0) {
                    resolve(url);
                } else {
                    reject(new Error('Image has invalid dimensions'));
                }
            };
            
            img.onerror = () => {
                reject(new Error('Image failed to load'));
            };
            
            img.src = url;
        });
    },

    /**
     * Get image URL for an entity with fallbacks
     */
    async getImageUrl(entity, type = 'default') {
        if (!entity) {
            return this.getPlaceholder(type);
        }

        const urls = this.generateFallbackUrls(entity, type);
        
        // Check in-memory cache first
        const cacheKey = urls[0];
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Preload image with fallbacks
        const imageUrl = await this.preloadImage(urls);
        
        // Cache in memory
        this.cache.set(cacheKey, imageUrl);
        
        return imageUrl;
    },

    /**
     * Create an img element with lazy loading and fallbacks
     */
    createImageElement(entity, type = 'default', options = {}) {
        const {
            className = '',
            alt = '',
            width = this.config.defaultWidth,
            height = this.config.defaultHeight,
            loading = 'lazy'
        } = options;

        const img = document.createElement('img');
        img.className = className;
        img.alt = alt || entity?.name || 'Image';
        img.width = width;
        img.height = height;
        img.loading = loading;
        
        // Start with placeholder
        img.src = this.getPlaceholder(type);
        img.dataset.type = type;
        img.dataset.entityId = entity?.id || '';

        // Load actual image asynchronously
        this.getImageUrl(entity, type).then(url => {
            img.src = url;
            img.classList.add('loaded');
        }).catch(error => {
            console.error('[ImageService] Failed to load image:', error);
            img.src = this.getPlaceholder(type);
        });

        return img;
    },

    /**
     * Batch load images for multiple entities
     */
    async batchLoadImages(entities, type = 'default') {
        const promises = entities.map(entity => 
            this.getImageUrl(entity, type)
        );
        
        return Promise.allSettled(promises);
    },

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.failedUrls.clear();
        
        // Clear localStorage cache
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.config.cachePrefix)) {
                localStorage.removeItem(key);
            }
        });
    },

    /**
     * Get cache statistics
     */
    getCacheStats() {
        const localStorageKeys = Object.keys(localStorage).filter(
            key => key.startsWith(this.config.cachePrefix)
        );
        
        return {
            memoryCache: this.cache.size,
            localStorageCache: localStorageKeys.length,
            failedUrls: this.failedUrls.size
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageService;
}
