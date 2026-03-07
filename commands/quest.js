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

    // Prepare locations
    const locations =
      quest.locations && quest.locations.length > 0
        ? quest.locations.join(", ")
        : "Unknown";

    // Prepare objectives
    const objectives =
      quest.objectives && quest.objectives.length > 0
        ? quest.objectives.join("\n")
        : "None";

    // Prepare rewards
    const rewardsList =
      quest.rewards && quest.rewards.length > 0
        ? quest.rewards
            .map((r) => `• ${r.item.name} x${r.quantity} (${r.item.rarity})`)
            .join("\n")
        : "None";

    const embed = new EmbedBuilder()
      .setTitle(`📋 ${quest.name}`)
      .setColor("#3BA55D")
      .addFields(
        {
          name: "📌 Objectives",
          value:
            quest.objectives && quest.objectives.length > 0
              ? quest.objectives.map((obj, i) => `• ${obj}`).join("\n")
              : "None",
          inline: false,
        },
        {
          name: "📍 Locations",
          value:
            quest.locations && quest.locations.length > 0
              ? quest.locations.join(", ")
              : "Unknown",
          inline: true,
        },
        {
          name: "🎁 Rewards",
          value:
            quest.rewards && quest.rewards.length > 0
              ? quest.rewards
                  .map(
                    (r) => `• ${r.item.name} x${r.quantity} (${r.item.rarity})`,
                  )
                  .join("\n")
              : "None",
          inline: false,
        },
        {
          name: "🔗 Guide",
          value:
            quest.guide_links && quest.guide_links.length > 0
              ? quest.guide_links
                  .map((link) => `[${link.label}](${link.url})`)
                  .join("\n")
              : "None",
          inline: false,
        },
        {
          name: "🧑‍💼 Trader",
          value: quest.trader_name || "Unknown",
          inline: true,
        },
      )
      .setThumbnail(quest.image)
      .setFooter({ text: "ARC Raiders Database" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
