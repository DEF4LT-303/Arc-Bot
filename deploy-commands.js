require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");

if (
  !process.env.DISCORD_TOKEN ||
  !process.env.CLIENT_ID ||
  !process.env.GUILD_ID
) {
  console.error(
    "Please set DISCORD_TOKEN, CLIENT_ID and GUILD_ID in your .env file.",
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
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID,
      ),
      { body: commands },
    );
    console.log("Slash commands registered.");
  } catch (err) {
    console.error("Failed to register commands", err);
  } finally {
    process.exit(0); // Exit cleanly after deployment
  }
})();
