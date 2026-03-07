const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const cache = require("../cache");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("item")
    .setDescription("Search ARC Raiders item")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Item name")
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();

    // don't fetch if input is too short
    if (!focusedValue || focusedValue.length < 1) {
      return interaction.respond([]);
    }

    try {
      // search cache instead of API
      const results = cache.search(focusedValue);
      const items = results.map((item) => ({
        name: item.name,
        value: item.name,
      }));

      await interaction.respond(items);
    } catch (err) {
      console.error("Autocomplete error:", err);
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    const name = interaction.options.getString("name");

    // get item from cache
    const item = cache.getByName(name);

    if (!item) {
      return interaction.reply("Item not found.");
    }

    const stats = item.stat_block;

    const embed = new EmbedBuilder()
      .setTitle(`📦 ${item.name}`)
      .setDescription(item.description || "No description")
      .setThumbnail(item.icon)
      .setColor("#3BA55D")
      .addFields(
        {
          name: "📊 Item Info",
          value:
            `**Type:** ${item.item_type}\n` +
            `**Rarity:** ${item.rarity}\n` +
            `**Value:** ${item.value}`,
          inline: true,
        },
        {
          name: "⚖️ Stats",
          value:
            `**Weight:** ${stats.weight}\n` +
            `**Stack Size:** ${stats.stackSize}`,
          inline: true,
        },
        {
          name: "📍 Loot Areas",
          value: item.loot_area || "Unknown",
          inline: false,
        },
      )
      .setFooter({
        text: "ARC Raiders Database",
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
