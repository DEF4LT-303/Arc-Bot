const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
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
    if (!focusedValue || focusedValue.length < 1)
      return interaction.respond([]);

    try {
      const results = cache.search(focusedValue);
      const items = results.map((item) => ({
        name: item.name,
        value: item.name,
      }));
      await interaction.respond(items);
    } catch {
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    const name = interaction.options.getString("name");
    const item = cache.getByName(name);

    if (!item) return interaction.reply("Item not found.");

    const usedIn = item.used_in || [];
    const pageSize = 10; // max 10 per page
    let page = 0;

    const generateEmbed = (page) => {
      const embed = new EmbedBuilder()
        .setTitle(`📦 ${item.name}`)
        .setDescription(item.description || "No description")
        .setThumbnail(item.icon)
        .setColor("#3BA55D")
        .addFields(
          {
            name: "📊 Item Info",
            value: `**Type:** ${item.item_type}\n**Rarity:** ${item.rarity}\n**Value:** ${item.value}`,
            inline: true,
          },
          {
            name: "⚖️ Stats",
            value: `**Weight:** ${item.stat_block?.weight || "N/A"}\n**Stack Size:** ${item.stat_block?.stackSize || "N/A"}`,
            inline: true,
          },
          {
            name: "📍 Loot Areas",
            value: item.loot_area || "Unknown",
            inline: false,
          },
        );

      if (usedIn.length) {
        const start = page * pageSize;
        const end = start + pageSize;
        const currentItems = usedIn.slice(start, end);

        embed.addFields({
          name: `🔧 Used In (Page ${page + 1}/${Math.ceil(usedIn.length / pageSize)})`,
          value: currentItems
            .map((u) => `• ${u.item.name} x${u.quantity}`)
            .join("\n"),
          inline: false,
        });
      }

      return embed;
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("⬅️ Previous")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next ➡️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(usedIn.length <= pageSize),
    );

    const msg = await interaction.reply({
      embeds: [generateEmbed(page)],
      components: [row],
      fetchReply: true,
    });

    if (!usedIn.length || usedIn.length <= pageSize) return;

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    });

    collector.on("collect", (btn) => {
      if (btn.user.id !== interaction.user.id)
        return btn.reply({
          content: "You can't use these buttons.",
          ephemeral: true,
        });

      if (btn.customId === "next") page++;
      if (btn.customId === "prev") page--;

      row.components[0].setDisabled(page === 0);
      row.components[1].setDisabled(
        page >= Math.ceil(usedIn.length / pageSize) - 1,
      );

      btn.update({ embeds: [generateEmbed(page)], components: [row] });
    });

    collector.on("end", () => {
      row.components.forEach((c) => c.setDisabled(true));
      interaction.editReply({ components: [row] });
    });
  },
};
