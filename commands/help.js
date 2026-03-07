const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("View all available commands and how to use them"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("🤖 ARC Raiders Bot - Help")
      .setDescription("Complete guide to all available commands")
      .setColor("#3BA55D")
      .addFields(
        {
          name: "📦 `/item name:` - Search for Items",
          value:
            "Search the ARC Raiders item database by name.\n" +
            "• **Autocomplete support** - Type the item name and see suggestions\n" +
            "• Shows: Item type, rarity, value, weight, stack size, and loot areas\n" +
            "• Example: `/item name:weapon`",
          inline: false,
        },
        {
          name: "📋 `/quest name:` - Search for Quests",
          value:
            "Search the ARC Raiders quest database by name.\n" +
            "• **Autocomplete support** - Type the quest name and see suggestions\n" +
            "• Shows: Quest location, difficulty, required items, and rewards\n" +
            "• Example: `/quest name:extraction`",
          inline: false,
        },
        {
          name: "⏰ `/events` - View Event Timers",
          value:
            "View current and upcoming map events and timers.\n" +
            "• **No map specified** - Shows one embed per map with upcoming events\n" +
            "• **Map specified** - Shows all events for that specific map\n" +
            "• **Event specified** - Shows all maps that have that event active/upcoming\n" +
            "• Status indicators: 🕐 (upcoming), 🔴 (active)\n" +
            "• Available maps: Buried City, Spaceport, Dam, Blue Gate, Stella Montis\n" +
            "• Examples:\n" +
            "  - `/events` (all maps)\n" +
            "  - `/events map:Dam` (specific map)\n" +
            "  - `/events event:Night Raid` (specific event)",
          inline: false,
        },
        {
          name: "ℹ️ `/help` - This Command",
          value: "Shows this help message with all available commands.",
          inline: false,
        },
        {
          name: "💾 `/cache` - Cache Status",
          value:
            "Check cache statistics, last update time, and current status.",
          inline: false,
        },
      )
      .addFields({
        name: "💾 Data & Caching",
        value:
          "All data is cached and refreshed every hour:\n" +
          "• Items: Full database cached for instant searches\n" +
          "• Quests: Complete quest information cached\n" +
          "• Events: Latest event schedule cached\n\n" +
          "This reduces API calls and ensures fast responses!",
        inline: false,
      })
      .setFooter({
        text: "ARC Raiders Bot | Data from MetaForge API",
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
