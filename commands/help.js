const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("View all available commands and how to use them"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("🤖 ARC Raiders Bot - Help")
      .setDescription("Quick guide to all available commands")
      .setColor("#3BA55D")
      .addFields(
        {
          name: "📦 `/item name:` - Search Items",
          value:
            "Search the ARC Raiders item database by name with autocomplete.\n" +
            "Shows type, rarity, value, weight, stack size, and loot areas.\n" +
            "Example: `/item name:weapon`",
          inline: false,
        },
        {
          name: "📋 `/quest name:` - Search Quests",
          value:
            "Search quests by name with autocomplete.\n" +
            "Shows location, difficulty, required items, and rewards.\n" +
            "Example: `/quest name:extraction`",
          inline: false,
        },
        {
          name: "⏰ `/events` - View Event Timers",
          value:
            "Check current and upcoming map events.\n" +
            "Filter by map or event if needed.\n" +
            "Status: 🕐 upcoming, 🔴 active.\n" +
            "Example: `/events map:Dam`",
          inline: false,
        },
        {
          name: "🔔 `/notifications` - Manage Notifications",
          value:
            "View, remove, or clear your event notifications.\n" +
            "Notifications are sent when events go live.\n" +
            "Use numbered buttons to remove or clear all notifications.",
          inline: false,
        },
        {
          name: "ℹ️ `/help` - This Command",
          value: "Shows this concise help message.",
          inline: false,
        },
        // {
        //   name: "💾 `/cache` - Cache Status",
        //   value: "Check cache stats, last update, and current status.",
        //   inline: false,
        // },
        {
          name: "🤖 `/invite` - Invite Bot",
          value: "Get the link to add this bot to your server.",
          inline: false,
        },
      )
      .setFooter({
        text: "ARC Raiders Bot | Data from MetaForge API",
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
