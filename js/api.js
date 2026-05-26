/**
 * One Piece Encyclopedia - Premium API Engine v2
 * Base: https://api.api-onepiece.com/v2/
 */

const API_CONFIG = {
    BASE_URL: 'https://api.api-onepiece.com/v2',
    LANG: 'en',
    TIMEOUT: 10000
};

const OP_API = {
    /**
     * Make a request to the API with error handling
     */
    async request(path, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
        
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/${path}`, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Handle different response formats
            if (data && typeof data === 'object') {
                if ('data' in data) return data.data;
                if ('results' in data) return data.results;
                return data;
            }
            
            return data;
            
        } catch (error) {
            clearTimeout(timeoutId);
            console.error(`[OP_API] Error fetching ${path}:`, error.message);
            
            if (error.name === 'AbortError') {
                console.error('[OP_API] Request timeout');
            }
            
            return null;
        }
    },

    /**
     * Get all characters
     */
    getCharacters: async () => {
        return await OP_API.request(`characters/${API_CONFIG.LANG}`);
    },

    /**
     * Get character by ID
     */
    getCharacterById: async (id) => {
        return await OP_API.request(`characters/${API_CONFIG.LANG}/${id}`);
    },

    /**
     * Search characters
     */
    searchCharacters: async (query) => {
        return await OP_API.request(`characters/${API_CONFIG.LANG}/search/${encodeURIComponent(query)}`);
    },

    /**
     * Get characters by crew
     */
    getCharactersByCrew: async (crewId) => {
        return await OP_API.request(`characters/${API_CONFIG.LANG}/crew/${crewId}`);
    },

    /**
     * Count characters by crew
     */
    countCharactersByCrew: async (crewId) => {
        return await OP_API.request(`characters/${API_CONFIG.LANG}/crew/${crewId}/count`);
    },

    /**
     * Get all devil fruits
     */
    getFruits: async () => {
        return await OP_API.request(`fruits/${API_CONFIG.LANG}`);
    },

    /**
     * Get fruit by ID
     */
    getFruitById: async (id) => {
        return await OP_API.request(`fruits/${API_CONFIG.LANG}/${id}`);
    },

    /**
     * Search fruits
     */
    searchFruits: async (query) => {
        return await OP_API.request(`fruits/${API_CONFIG.LANG}/search/${encodeURIComponent(query)}`);
    },

    /**
     * Count fruits
     */
    countFruits: async () => {
        return await OP_API.request(`fruits/${API_CONFIG.LANG}/count`);
    },

    /**
     * Get all swords
     */
    getSwords: async () => {
        return await OP_API.request(`swords/${API_CONFIG.LANG}`);
    },

    /**
     * Get sword by ID
     */
    getSwordById: async (id) => {
        return await OP_API.request(`swords/${API_CONFIG.LANG}/${id}`);
    },

    /**
     * Search swords
     */
    searchSwords: async (query) => {
        return await OP_API.request(`swords/${API_CONFIG.LANG}/search/${encodeURIComponent(query)}`);
    },

    /**
     * Get swords by state
     */
    getSwordsByState: async () => {
        return await OP_API.request(`swords/${API_CONFIG.LANG}/state`);
    },

    /**
     * Count swords by state
     */
    countSwordsByState: async () => {
        return await OP_API.request(`swords/${API_CONFIG.LANG}/state/count`);
    },

    /**
     * Get all crews
     */
    getCrews: async () => {
        return await OP_API.request(`crews/${API_CONFIG.LANG}`);
    },

    /**
     * Get crew by ID
     */
    getCrewById: async (id) => {
        return await OP_API.request(`crews/${API_CONFIG.LANG}/${id}`);
    },

    /**
     * Search crews
     */
    searchCrews: async (query) => {
        return await OP_API.request(`crews/${API_CONFIG.LANG}/search/${encodeURIComponent(query)}`);
    },

    /**
     * Count crews
     */
    countCrews: async () => {
        return await OP_API.request(`crews/${API_CONFIG.LANG}/count`);
    },

    /**
     * Get Yonko crews
     */
    getYonko: async () => {
        // Try different endpoint formats for Yonko
        const result = await OP_API.request(`crews/${API_CONFIG.LANG}`);
        if (result) {
            // Filter crews that are Yonko based on their properties
            return result.filter(crew => 
                crew.isYonko || 
                crew.status === 'Yonko' || 
                crew.type === 'Yonko' ||
                crew.name?.toLowerCase().includes('yonko') ||
                crew.name?.toLowerCase().includes('beast') ||
                crew.name?.toLowerCase().includes('big mom') ||
                crew.name?.toLowerCase().includes('whitebeard') ||
                crew.name?.toLowerCase().includes('shanks') ||
                crew.name?.toLowerCase().includes('cross guild')
            );
        }
        return [];
    },

    /**
     * Count Yonko
     */
    countYonko: async () => {
        const yonko = await OP_API.getYonko();
        return yonko.length;
    },

    /**
     * Load all initial data for the homepage
     */
    loadInitialData: async () => {
        try {
            const [characters, crews, fruits, swords, yonko] = await Promise.all([
                OP_API.getCharacters(),
                OP_API.getCrews(),
                OP_API.getFruits(),
                OP_API.getSwords(),
                OP_API.getYonko()
            ]);

            return {
                characters: characters || [],
                crews: crews || [],
                fruits: fruits || [],
                swords: swords || [],
                yonko: yonko || []
            };
        } catch (error) {
            console.error('[OP_API] Error loading initial data:', error);
            return {
                characters: [],
                crews: [],
                fruits: [],
                swords: [],
                yonko: []
            };
        }
    }
};

window.OP_API = OP_API;
