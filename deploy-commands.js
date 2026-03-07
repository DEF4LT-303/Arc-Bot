require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error("Please set DISCORD_TOKEN and CLIENT_ID in your .env file.");
  process.exit(1);
}

// Support multiple guild IDs (comma-separated)
const guildIds = process.env.GUILD_ID
  ? process.env.GUILD_ID.split(",").map((id) => id.trim())
  : [];

if (guildIds.length === 0) {
  console.error(
    "Please set GUILD_ID in your .env file (comma-separated for multiple guilds).",
  );
  process.exit(1);
}

const commands = [];
const commandFiles = fs.readdirSync("./commands");
for (const file of commandFiles) {
  const cmd = require(`./commands/${file}`);
  if (cmd.data) commands.push(cmd.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Refreshing slash commands…");

    // Register commands for each guild
    for (const guildId of guildIds) {
      console.log(`Registering commands for guild: ${guildId}`);
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: commands },
      );
      console.log(`✅ Commands registered for guild: ${guildId}`);
    }

    console.log("All slash commands registered successfully.");
  } catch (err) {
    console.error("Failed to register commands", err);
  } finally {
    process.exit(0);
  }
})();
