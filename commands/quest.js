const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const cache = require("../cache");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("quest")
    .setDescription("Search ARC Raiders quests")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Quest name")
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();

    if (!focusedValue || focusedValue.length < 1) {
      return interaction.respond([]);
    }

    try {
      const results = cache.searchQuests(focusedValue);
      const quests = results.map((quest) => ({
        name: quest.name,
        value: quest.name,
      }));

      await interaction.respond(quests);
    } catch (err) {
      console.error("Autocomplete error:", err);
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    const name = interaction.options.getString("name");

    const quest = cache.getQuestByName(name);

    if (!quest) {
      return interaction.reply("Quest not found.");
    }

    const embed = new EmbedBuilder()
      .setTitle(`📋 ${quest.name}`)
      .setDescription(quest.description || "No description")
      .setColor("#3BA55D")
      .addFields(
        {
          name: "📍 Location",
          value: quest.map_name || "Unknown",
          inline: true,
        },
        {
          name: "⭐ Difficulty",
          value: quest.difficulty || "Unknown",
          inline: true,
        },
      );

    // Add required items if available
    if (quest.required_items && quest.required_items.length > 0) {
      const itemsList = quest.required_items
        .map((item) => `• ${item.name}`)
        .join("\n");
      embed.addFields({
        name: "📦 Required Items",
        value: itemsList || "None",
        inline: false,
      });
    }

    // Add rewards if available
    if (quest.rewards && quest.rewards.length > 0) {
      const rewardsList = quest.rewards
        .map((reward) => `• ${reward.name}`)
        .join("\n");
      embed.addFields({
        name: "🎁 Rewards",
        value: rewardsList || "None",
        inline: false,
      });
    }

    embed
      .setFooter({
        text: "ARC Raiders Database",
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
