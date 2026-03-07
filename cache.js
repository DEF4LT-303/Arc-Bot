const axios = require("axios");
const fs = require("fs");
const path = require("path");
const logger = require("./logger");

class ItemCache {
  constructor() {
    this.items = [];
    this.quests = [];
    this.events = [];
    this.lastUpdated = null;
    this.isUpdating = false;
    this.cacheFile = path.join(__dirname, "cache-data.json");
    this.loadFromFile(); // Load cache from file on startup
  }

  // Load cache from file
  loadFromFile() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = JSON.parse(fs.readFileSync(this.cacheFile, "utf8"));
        this.items = data.items || [];
        this.quests = data.quests || [];
        this.events = data.events || [];
        this.lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : null;
        logger.info(
          `Loaded cache from file: ${this.items.length} items, ${this.quests.length} quests, ${this.events.length} events`,
        );
      }
    } catch (err) {
      logger.info(`Failed to load cache from file: ${err.message}`);
    }
  }

  // Save cache to file
  saveToFile() {
    try {
      const data = {
        items: this.items,
        quests: this.quests,
        events: this.events,
        lastUpdated: this.lastUpdated,
      };
      fs.writeFileSync(this.cacheFile, JSON.stringify(data, null, 2));
      logger.info("Cache saved to file");
    } catch (err) {
      logger.info(`Failed to save cache to file: ${err.message}`);
    }
  }

  // Fetch all items from API and cache them
  async refreshCache() {
    if (this.isUpdating) {
      logger.info("Cache refresh already in progress, skipping...");
      return;
    }

    this.isUpdating = true;
    try {
      logger.info("Refreshing cache...");

      // Fetch items (paginated)
      let allItems = [];
      let page = 1;
      let hasNextPage = true;
      while (hasNextPage) {
        const res = await axios.get(
          `https://metaforge.app/api/arc-raiders/items?page=${page}&limit=100`,
        );
        allItems = allItems.concat(res.data.data || []);
        hasNextPage = res.data.pagination?.hasNextPage || false;
        page++;
      }
      this.items = allItems;

      // Fetch quests (paginated)
      let allQuests = [];
      page = 1;
      hasNextPage = true;
      while (hasNextPage) {
        const res = await axios.get(
          `https://metaforge.app/api/arc-raiders/quests?page=${page}&limit=100`,
        );
        allQuests = allQuests.concat(res.data.data || []);
        hasNextPage = res.data.pagination?.hasNextPage || false;
        page++;
      }
      this.quests = allQuests;

      // Fetch events (usually not paginated, but handle it anyway)
      const eventsRes = await axios.get(
        "https://metaforge.app/api/arc-raiders/events-schedule",
      );
      this.events = eventsRes.data.data || [];

      this.lastUpdated = new Date();
      logger.info(
        `Cache refreshed: ${this.items.length} items, ${this.quests.length} quests, ${this.events.length} events`,
      );

      // Save cache to file for persistence
      this.saveToFile();
    } catch (err) {
      logger.info(`Cache refresh failed: ${err.message}`);
    } finally {
      this.isUpdating = false;
    }
  }

  // Search items in cache (case-insensitive partial match)
  search(query) {
    if (!query || query.length < 1) return [];

    const lowerQuery = query.toLowerCase();
    return this.items
      .filter((item) => item.name.toLowerCase().includes(lowerQuery))
      .slice(0, 25); // Discord max is 25 suggestions
  }

  // Get single item by exact name
  getByName(name) {
    return this.items.find(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );
  }

  // Search quests by name (case-insensitive partial match)
  searchQuests(query) {
    if (!query || query.length < 1) return [];

    const lowerQuery = query.toLowerCase();
    return this.quests
      .filter((quest) => quest.name.toLowerCase().includes(lowerQuery))
      .slice(0, 25);
  }

  // Get single quest by exact name
  getQuestByName(name) {
    return this.quests.find(
      (quest) => quest.name.toLowerCase() === name.toLowerCase(),
    );
  }

  // Get all events
  getEvents() {
    return this.events;
  }

  // Get cache status
  getStatus() {
    return {
      itemsLoaded: this.items.length,
      lastUpdated: this.lastUpdated,
      isUpdating: this.isUpdating,
    };
  }
}

const cache = new ItemCache();

// Initialize cache on startup
cache.refreshCache();

// Refresh cache every hour (3600000 ms)
setInterval(
  () => {
    cache.refreshCache();
  },
  60 * 60 * 1000,
);

module.exports = cache;
