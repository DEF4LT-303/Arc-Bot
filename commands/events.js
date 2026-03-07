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
        ephemeral: true, // only visible to the user
      });
    }

    let events = cache.getEvents();

    if (!events || events.length === 0) {
      return interaction.reply(
        "No events currently scheduled or cache not loaded yet.",
      );
    }

    const now = Date.now();

    // Keep only upcoming or active events
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
        const startDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);
        const durationMins = (event.endTime - event.startTime) / 1000 / 60;

        const timeUntilStart = event.startTime - now;

        let timeStatus = "";
        if (timeUntilStart > 0) {
          const hours = Math.floor(timeUntilStart / 1000 / 60 / 60);
          const mins = Math.floor((timeUntilStart / 1000 / 60) % 60);
          timeStatus = `🕐 Starts in ${hours}h ${mins}m`;
        } else {
          const minsRemaining = Math.floor((event.endTime - now) / 1000 / 60);
          timeStatus = `🔴 ACTIVE (${minsRemaining}m remaining)`;
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
              value: startDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              inline: true,
            },
            {
              name: "🕑 End",
              value: endDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
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
          const startDate = new Date(event.startTime);
          const endDate = new Date(event.endTime);

          const timeUntilStart = event.startTime - now;

          let timeStatus = "";
          if (timeUntilStart > 0) {
            const hours = Math.floor(timeUntilStart / 1000 / 60 / 60);
            const mins = Math.floor((timeUntilStart / 1000 / 60) % 60);
            timeStatus = `🕐 ${hours}h ${mins}m`;
          } else {
            const minsRemaining = Math.floor((event.endTime - now) / 1000 / 60);
            timeStatus = `🔴 ${minsRemaining}m left`;
          }

          return `**${event.name}**
${timeStatus} • ${startDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })} - ${endDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}`;
        })
        .join("\n\n");

      const embed = new EmbedBuilder()
        .setTitle(`🗺️ ${selectedMap} Events`)
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
            const startDate = new Date(event.startTime);

            const timeUntilStart = event.startTime - now;

            let timeStatus = "";
            if (timeUntilStart > 0) {
              const hours = Math.floor(timeUntilStart / 1000 / 60 / 60);
              const mins = Math.floor((timeUntilStart / 1000 / 60) % 60);
              timeStatus = `🕐 ${hours}h ${mins}m`;
            } else {
              const minsRemaining = Math.floor(
                (event.endTime - now) / 1000 / 60,
              );
              timeStatus = `🔴 ${minsRemaining}m left`;
            }

            return `**${event.name}**
${timeStatus} • ${startDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}`;
          })
          .join("\n\n");

        const embed = new EmbedBuilder()
          .setTitle(`🗺️ ${mapName}`)
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
