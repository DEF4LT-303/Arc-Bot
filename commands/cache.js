const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const cache = require("../cache");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cache")
    .setDescription("Check cache status and statistics"),

  async execute(interaction) {
    const status = cache.getStatus();

    const embed = new EmbedBuilder()
      .setTitle("💾 Cache Status")
      .setDescription("Current cache statistics and health")
      .setColor(status.itemsLoaded > 0 ? "#3BA55D" : "#FF6B6B")
      .addFields(
        {
          name: "📊 Cache Statistics",
          value:
            `• **Items cached:** ${status.itemsLoaded}\n` +
            `• **Quests cached:** ${cache.quests?.length || 0}\n` +
            `• **Events cached:** ${cache.events?.length || 0}\n` +
            `• **Cache file:** ${require("fs").existsSync(require("path").join(__dirname, "../cache-data.json")) ? "✅ Present" : "❌ Missing"}`,
          inline: false,
        },
        {
          name: "⏰ Last Update",
          value: status.lastUpdated
            ? `<t:${Math.floor(status.lastUpdated.getTime() / 1000)}:R>`
            : "Never updated",
          inline: true,
        },
        {
          name: "🔄 Status",
          value: status.isUpdating ? "🔄 Updating..." : "✅ Ready",
          inline: true,
        },
      )
      .setFooter({
        text: "Cache refreshes automatically every hour",
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
