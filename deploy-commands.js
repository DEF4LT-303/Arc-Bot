require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error("Please set DISCORD_TOKEN and CLIENT_ID in your .env file.");
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
    console.log("Registering slash commands globally…");

    // Register commands globally
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });

    console.log(`✅ ${commands.length} commands registered globally.`);
    console.log(
      "Commands will be available in all servers where the bot is invited.",
    );
  } catch (err) {
    console.error("Failed to register commands", err);
  } finally {
    process.exit(0);
  }
})();
