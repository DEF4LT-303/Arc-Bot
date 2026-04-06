const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Show bot latency and Discord API latency"),

  async execute(interaction) {
    const apiLatency = Math.round(interaction.client.ws.ping);
    const botLatency = Math.abs(Date.now() - interaction.createdTimestamp);

    const embed = new EmbedBuilder()
      .setTitle("🏓 Pong!")
      .setColor("#3BA55D")
      .setDescription("Latency check for ARC Raiders Bot")
      .addFields(
        {
          name: "Bot latency",
          value: `${botLatency}ms`,
          inline: true,
        },
        {
          name: "API latency",
          value: `${apiLatency}ms`,
          inline: true,
        },
      )
      .setFooter({ text: "ARC Raiders Bot | /ping" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
