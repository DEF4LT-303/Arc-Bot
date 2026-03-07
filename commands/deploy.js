const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { REST, Routes } = require("discord.js");
const fs = require("fs");

const DEV_USER_ID = "305681776427139073";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deploy")
    .setDescription("[DEV ONLY] Deploy slash commands"),

  async execute(interaction) {
    // Check if user is the developer
    if (interaction.user.id !== DEV_USER_ID) {
      const embed = new EmbedBuilder()
        .setTitle("❌ Access Denied")
        .setDescription("This command is only available to the bot developer.")
        .setColor("#FF6B6B");

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    // Defer reply as this might take a moment
    await interaction.deferReply({ ephemeral: true });

    try {
      if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
        throw new Error("DISCORD_TOKEN or CLIENT_ID not configured");
      }

      const commands = [];
      const commandFiles = fs.readdirSync("./commands");

      for (const file of commandFiles) {
        const cmd = require(`../commands/${file}`);
        if (cmd.data) {
          commands.push(cmd.data.toJSON());
        }
      }

      const rest = new REST({ version: "10" }).setToken(
        process.env.DISCORD_TOKEN,
      );

      console.log("🚀 Deploying slash commands...");
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: commands,
      });

      const embed = new EmbedBuilder()
        .setTitle("✅ Commands Deployed")
        .setDescription(
          `Successfully deployed ${commands.length} commands globally.`,
        )
        .setColor("#3BA55D")
        .addFields(
          {
            name: "📊 Details",
            value: `**Commands registered:** ${commands.length}\n**Status:** Global deployment complete`,
            inline: false,
          },
          {
            name: "⏱️ Wait Time",
            value:
              "Global commands are usually available immediately, but may take up to 1 hour to appear everywhere.",
            inline: false,
          },
        );

      await interaction.editReply({ embeds: [embed] });
      console.log("✅ Deploy command executed successfully");
    } catch (err) {
      console.error("Deploy error:", err);

      const embed = new EmbedBuilder()
        .setTitle("❌ Deployment Failed")
        .setDescription(`Error: ${err.message}`)
        .setColor("#FF6B6B");

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
