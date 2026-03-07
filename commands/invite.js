const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Get the invite link for this bot"),

  async execute(interaction) {
    const clientId = process.env.CLIENT_ID;

    if (!clientId) {
      await interaction.reply({
        content: "❌ Bot CLIENT_ID not configured",
        ephemeral: true,
      });
      return;
    }

    // OAuth2 invite URL with bot and slash commands scopes
    const permissions = [
      "SendMessages",
      "ReadMessages",
      "EmbedLinks",
      "ReadMessageHistory",
    ];

    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=0&scope=bot%20applications.commands`;

    const embed = new EmbedBuilder()
      .setTitle("🤖 Invite Arc Bot")
      .setDescription(
        "Click the button below or use the link to invite this bot to your server",
      )
      .setColor("#3BA55D")
      .addFields({
        name: "📋 Required Permissions",
        value:
          "• Send Messages\n" +
          "• Read Messages/View Channels\n" +
          "• Embed Links\n" +
          "• Read Message History",
        inline: false,
      })
      .addFields({
        name: "🔗 Invite Link",
        value: `[Click here to invite](${inviteUrl})`,
        inline: false,
      })
      .setFooter({
        text: "ARC Raiders Bot | Always use the official invite link",
      });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
