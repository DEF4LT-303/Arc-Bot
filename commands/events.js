const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
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

    let embeds = [];
    let content = "";

    // EVENT LOOKUP MODE
    if (selectedEvent) {
      const matching = upcoming
        .filter((event) => event.name === selectedEvent)
        .slice(0, 10);

      if (matching.length === 0) {
        return interaction.reply(
          `No upcoming **${selectedEvent}** events found.`,
        );
      }

      embeds = matching.map((event) => {
        const startUnix = Math.floor(event.startTime / 1000);
        const endUnix = Math.floor(event.endTime / 1000);
        const durationMins = (event.endTime - event.startTime) / 1000 / 60;

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
            {
              name: "⏱️ Status",
              value: timeStatus,
              inline: false,
            },
            {
              name: "🕐 Start",
              value: `<t:${startUnix}:t>`,
              inline: true,
            },
            {
              name: "🕑 End",
              value: `<t:${endUnix}:t>`,
              inline: true,
            },
            {
              name: "⏳ Duration",
              value: `${durationMins} minutes`,
              inline: true,
            },
          )
          .setFooter({ text: "ARC Raiders Bot | Data from MetaForge API" })
          .setTimestamp();
      });

      content = `Showing upcoming **${selectedEvent}** events`;
    }

    // MAP LOOKUP MODE
    else if (selectedMap) {
      const mapEvents = upcoming
        .filter((event) => event.map === selectedMap)
        .slice(0, 10);

      if (mapEvents.length === 0) {
        return interaction.reply(
          `No upcoming events found for **${selectedMap}**.`,
        );
      }

      const eventList = mapEvents
        .map((event) => {
          const startUnix = Math.floor(event.startTime / 1000);
          const endUnix = Math.floor(event.endTime / 1000);

          const timeUntilStart = event.startTime - now;

          let timeStatus = "";
          if (timeUntilStart > 0) {
            timeStatus = `🕐 <t:${startUnix}:R>`;
          } else {
            timeStatus = `🔴 ends <t:${endUnix}:R>`;
          }

          return `**${event.name}**
${timeStatus} • <t:${startUnix}:t> - <t:${endUnix}:t>`;
        })
        .join("\n\n");

      const embed = new EmbedBuilder()
        .setTitle(`📍 ${selectedMap} Events`)
        .setDescription(eventList)
        .setColor("#3BA55D")
        .setFooter({ text: "ARC Raiders Bot | Data from MetaForge API" })
        .setTimestamp();

      embeds = [embed];
      content = `Showing ${mapEvents.length} upcoming events on **${selectedMap}**`;
    }

    // ALL MAPS MODE
    else {
      const maps = [
        "Buried City",
        "Spaceport",
        "Dam",
        "Blue Gate",
        "Stella Montis",
      ];

      for (const mapName of maps) {
        const mapUpcoming = upcoming
          .filter((event) => event.map === mapName)
          .slice(0, 5);

        if (mapUpcoming.length === 0) continue;

        const eventList = mapUpcoming
          .map((event) => {
            const startUnix = Math.floor(event.startTime / 1000);
            const endUnix = Math.floor(event.endTime / 1000);

            const timeUntilStart = event.startTime - now;

            let timeStatus = "";
            if (timeUntilStart > 0) {
              timeStatus = `🕐 <t:${startUnix}:R>`;
            } else {
              timeStatus = `🔴 ends <t:${endUnix}:R>`;
            }

            return `**${event.name}**
${timeStatus} • <t:${startUnix}:t>`;
          })
          .join("\n\n");

        const embed = new EmbedBuilder()
          .setTitle(`📍 ${mapName}`)
          .setDescription(eventList)
          .setColor("#3BA55D")
          .setFooter({ text: "ARC Raiders Bot | Data from MetaForge API" })
          .setTimestamp();

        embeds.push(embed);

        if (embeds.length >= 10) break;
      }

      content = `Showing upcoming events across all maps`;
    }

    await interaction.reply({
      content,
      embeds,
    });
  },
};
