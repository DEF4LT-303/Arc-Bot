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
    .setName("notifications")
    .setDescription("View and manage your event notifications"),

  async execute(interaction) {
    const userId = interaction.user.id;
    let allNotifications = cache
      .getNotifications()
      .filter((n) => n.userId === userId);

    if (allNotifications.length === 0) {
      return interaction.reply({
        content: "You have no active notifications.",
        ephemeral: true,
      });
    }

    // PAGINATION VARIABLES
    let page = 0;
    const pageSize = 5;
    const totalPages = () => Math.ceil(allNotifications.length / pageSize);

    const generateEmbed = (page) => {
      const notifications = allNotifications.slice(
        page * pageSize,
        (page + 1) * pageSize,
      );
      const now = Date.now();

      const embed = new EmbedBuilder()
        .setTitle("Your Event Notifications")
        .setColor("#3BA55D")
        .setTimestamp();

      notifications.forEach((notif, i) => {
        const event = notif.eventData;
        const startUnix = Math.floor(event.startTime / 1000);
        const isActive = event.startTime <= now;
        const status = isActive ? "🔴 ACTIVE" : `🕐 Starts <t:${startUnix}:R>`;
        embed.addFields({
          name: `${i + 1}. ${event.name} - ${event.map}`,
          value: `${status}\n🔔 Notified: ${notif.notified ? "Yes" : "No"}`,
          inline: false,
        });
      });

      if (totalPages() > 1) {
        embed.setFooter({ text: `Page ${page + 1} of ${totalPages()}` });
      }

      return embed;
    };

    const generateButtonRows = (page) => {
      const notifications = allNotifications.slice(
        page * pageSize,
        (page + 1) * pageSize,
      );
      const rows = [];
      let buttons = [];

      // Numbered remove buttons
      notifications.forEach((notif, i) => {
        buttons.push(
          new ButtonBuilder()
            .setCustomId(`remove-${page}-${i}`)
            .setLabel(`${i + 1}`)
            .setStyle(ButtonStyle.Danger),
        );

        if (buttons.length === 5 || i === notifications.length - 1) {
          rows.push(new ActionRowBuilder().addComponents(buttons));
          buttons = [];
        }
      });

      // Navigation + Clear All row
      const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prevPage")
          .setLabel("⬅️ Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("nextPage")
          .setLabel("Next ➡️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages() - 1),
        new ButtonBuilder()
          .setCustomId("clearAll")
          .setLabel("🗑️ Clear All")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(allNotifications.length === 0),
      );
      rows.push(navRow);

      return rows;
    };

    const msg = await interaction.reply({
      embeds: [generateEmbed(page)],
      components: generateButtonRows(page),
      fetchReply: true,
    });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000,
    });

    collector.on("collect", async (btn) => {
      if (btn.user.id !== interaction.user.id)
        return btn.reply({
          content: "You can't use these buttons.",
          ephemeral: true,
        });

      const customId = btn.customId;

      if (customId === "prevPage") page--;
      else if (customId === "nextPage") page++;
      else if (customId === "clearAll") {
        cache.clearNotifications(userId);
        allNotifications = [];
        return btn.update({
          content: "🗑️ All notifications cleared.",
          embeds: [],
          components: [],
        });
      } else if (customId.startsWith("remove-")) {
        const [_, btnPage, index] = customId.split("-").map(Number);
        const notifIndex = btnPage * pageSize + index;
        const notif = allNotifications[notifIndex];
        if (!notif) return;

        cache.removeNotification(userId, notif.eventId);
        allNotifications = allNotifications.filter(
          (n) => n.eventId !== notif.eventId,
        );
        if (page >= totalPages()) page = totalPages() - 1; // Adjust page if last page is removed
      }

      if (allNotifications.length === 0) {
        return btn.update({
          content: "🗑️ All notifications cleared.",
          embeds: [],
          components: [],
        });
      }

      await btn.update({
        embeds: [generateEmbed(page)],
        components: generateButtonRows(page),
      });
    });

    collector.on("end", () => {
      const disabledRows = generateButtonRows(page).map((row) => {
        row.components.forEach((c) => c.setDisabled(true));
        return row;
      });
      interaction.editReply({ components: disabledRows }).catch(() => {});
    });
  },
};
