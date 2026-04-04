const axios = require("axios");
const fs = require("fs");
const path = require("path");
const logger = require("./logger");

class ItemCache {
  constructor() {
    this.items = [];
    this.quests = [];
    this.events = [];
    this.notifications = [];
    this.lastUpdated = null;
    this.isUpdating = false;
    this.cacheFile = path.join(__dirname, "cache-data.json");
    this.loadFromFile();
  }

  addNotification(userId, event) {
    const id = `${event.name}-${event.map}-${event.startTime}`;

    const exists = this.notifications.find(
      (n) => n.userId === userId && n.eventId === id,
    );

    if (exists) return false;

    this.notifications.push({
      userId,
      eventId: id,
      startTime: event.startTime,
      eventData: event,
      notified: false,
    });

    this.saveToFile();
    return true;
  }

  getNotifications() {
    return this.notifications;
  }

  removeNotification(userId, eventId) {
    const index = this.notifications.findIndex(
      (n) => n.userId === userId && n.eventId === eventId,
    );

    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.saveToFile();
      return true;
    }
    return false;
  }

  markNotified(eventId, userId) {
    const sub = this.notifications.find(
      (n) => n.eventId === eventId && n.userId === userId,
    );

    if (sub) sub.notified = true;
  }

  async checkNotifications(client) {
    const now = Date.now();
    let changed = false;

    for (const sub of [...this.notifications]) {
      if (now >= sub.startTime) {
        try {
          const user = await client.users.fetch(sub.userId);
          const embed = {
            title: sub.eventData.name,
            description: `📍 ${sub.eventData.map}`,
            thumbnail: { url: sub.eventData.icon },
            color: 0xff0000,
            fields: [{ name: "Status", value: "🔴 Event is now LIVE" }],
          };

          await user.send({ embeds: [embed] });

          this.notifications = this.notifications.filter(
            (n) => !(n.userId === sub.userId && n.eventId === sub.eventId),
          );

          changed = true;
        } catch (err) {
          logger.info(`Notification failed: ${err.message}`);
        }
      }
    }

    if (changed) this.saveToFile(true);
  }

  // Load cache from file
  loadFromFile() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = JSON.parse(fs.readFileSync(this.cacheFile, "utf8"));
        this.items = data.items || [];
        this.quests = data.quests || [];
        this.events = data.events || [];
        this.notifications = data.notifications || [];
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
  saveToFile(quiet = false) {
    try {
      const data = {
        items: this.items,
        quests: this.quests,
        events: this.events,
        notifications: this.notifications,
        lastUpdated: this.lastUpdated,
      };
      fs.writeFileSync(this.cacheFile, JSON.stringify(data, null, 2));
      if (!quiet) logger.info("Cache saved to file");
    } catch (err) {
      logger.info(`Failed to save cache from file: ${err.message}`);
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
          `https://metaforge.app/api/arc-raiders/items?page=${page}&limit=100&includeComponents=true`,
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
