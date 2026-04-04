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
    .setName("events")
    .setDescription("View current and upcoming ARC Raiders map events")
    .addStringOption((option) =>
      option
        .setName("map")
        .setDescription("Filter by map (optional)")
        .addChoices(
          { name: "Buried City", value: "Buried City" },
          { name: "Spaceport", value: "Spaceport" },
          { name: "Dam", value: "Dam" },
          { name: "Blue Gate", value: "Blue Gate" },
          { name: "Stella Montis", value: "Stella Montis" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("event")
        .setDescription("Filter by event name (optional)")
        .addChoices(
          { name: "Night Raid", value: "Night Raid" },
          { name: "Cold Snap", value: "Cold Snap" },
          { name: "Matriarch", value: "Matriarch" },
          { name: "Prospecting Probes", value: "Prospecting Probes" },
          { name: "Hurricane", value: "Hurricane" },
          { name: "Harvester", value: "Harvester" },
          { name: "Electromagnetic Storm", value: "Electromagnetic Storm" },
          { name: "Bird City", value: "Bird City" },
          { name: "Husk Graveyard", value: "Husk Graveyard" },
          { name: "Lush Blooms", value: "Lush Blooms" },
          { name: "Locked Gate", value: "Locked Gate" },
          { name: "Uncovered Caches", value: "Uncovered Caches" },
          { name: "Hidden Bunker", value: "Hidden Bunker" },
          { name: "Launch Tower Loot", value: "Launch Tower Loot" },
          { name: "Close Scrutiny", value: "Close Scrutiny" },
        ),
    ),

  async execute(interaction) {
    const selectedMap = interaction.options.getString("map");
    const selectedEvent = interaction.options.getString("event");

    if (selectedMap && selectedEvent) {
      return interaction.reply({
        content:
          "⚠️ You can only choose **either a map or an event**, not both.",
        ephemeral: true,
      });
    }

    const events = cache.getEvents();
    if (!events || events.length === 0) {
      return interaction.reply(
        "No events currently scheduled or cache not loaded yet.",
      );
    }

    const now = Date.now();
    const upcoming = events.filter((event) => event.endTime > now);

    if (upcoming.length === 0) {
      return interaction.reply("No upcoming events found.");
    }

    // PAGINATION VARIABLES
    let page = 0;
    const pageSize = 1; // show 1 event per page for selected-event mode
    let filteredEvents = [];

    if (selectedEvent) {
      filteredEvents = upcoming.filter((e) => e.name === selectedEvent);
      if (filteredEvents.length === 0) {
        return interaction.reply(
          `No upcoming **${selectedEvent}** events found.`,
        );
      }
    } else if (selectedMap) {
      filteredEvents = upcoming.filter((e) => e.map === selectedMap);
      if (filteredEvents.length === 0) {
        return interaction.reply(
          `No upcoming events found for **${selectedMap}**.`,
        );
      }
    } else {
      // all maps mode
      filteredEvents = upcoming.slice(0, 10);
    }

    const generateEmbed = (page) => {
      const event = filteredEvents[page];
      const startUnix = Math.floor(event.startTime / 1000);
      const endUnix = Math.floor(event.endTime / 1000);
      const durationMins = Math.floor(
        (event.endTime - event.startTime) / 1000 / 60,
      );
      const timeUntilStart = event.startTime - now;

      let timeStatus = "";
      if (timeUntilStart > 0) {
        timeStatus = `🕐 Starts <t:${startUnix}:R>`;
      } else {
        timeStatus = `🔴 ACTIVE • ends <t:${endUnix}:R>`;
      }

      return new EmbedBuilder()
        .setTitle(event.name)
        .setDescription(`📍 **${event.map}**`)
        .setThumbnail(event.icon)
        .setColor(event.startTime > now ? "#3BA55D" : "#FF6B6B")
        .addFields(
          { name: "⏱️ Status", value: timeStatus, inline: false },
          { name: "🕐 Start", value: `<t:${startUnix}:t>`, inline: true },
          { name: "🕑 End", value: `<t:${endUnix}:t>`, inline: true },
          {
            name: "⏳ Duration",
            value: `${durationMins} minutes`,
            inline: true,
          },
        )
        .setFooter({
          text: `ARC Raiders Bot | Page ${page + 1} of ${filteredEvents.length}`,
        })
        .setTimestamp();
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("⬅️ Previous")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId("notify")
        .setLabel("🔔 Notify Me")
        .setStyle(ButtonStyle.Success)
        .setDisabled(filteredEvents[page].startTime <= now),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next ➡️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(filteredEvents.length <= 1),
    );

    const msg = await interaction.reply({
      embeds: [generateEmbed(page)],
      components: [row],
      fetchReply: true,
    });

    if (filteredEvents.length > 1) {
      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
      });

      collector.on("collect", async (btn) => {
        if (btn.user.id !== interaction.user.id)
          return btn.reply({
            content: "You can't use these buttons.",
            ephemeral: true,
          });

        if (btn.customId === "notify") {
          const event = filteredEvents[page];
          const success = cache.addNotification(btn.user.id, event);
          return btn.reply({
            content: success
              ? `🔔 Notification set for **${event.name}**`
              : "⚠️ You already set a reminder for this event.",
            ephemeral: true,
          });
        }

        if (btn.customId === "next") page++;
        if (btn.customId === "prev") page--;

        row.components[0].setDisabled(page === 0);
        row.components[2].setDisabled(page === filteredEvents.length - 1);
        row.components[1].setDisabled(filteredEvents[page].startTime <= now);

        await btn.update({
          embeds: [generateEmbed(page)],
          components: [row],
        });
      });

      collector.on("end", () => {
        row.components.forEach((c) => c.setDisabled(true));
        interaction.editReply({ components: [row] });
      });
    }
  },
};
