require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const logger = require("./logger");
const cache = require("./cache"); // Initialize cache on startup

// ensure required env vars exist
if (!process.env.DISCORD_TOKEN) {
  console.error("Missing DISCORD_TOKEN in environment. Set it in .env");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.on("interactionCreate", async (interaction) => {
  // handle autocomplete
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command || !command.autocomplete) return;

    try {
      await command.autocomplete(interaction);
    } catch (err) {
      console.error("Autocomplete error:", err);
    }
    return;
  }

  // handle slash commands
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    logger.unknownCommand(
      interaction.commandName,
      interaction.user.id,
      interaction.user.username,
    );
    return interaction.reply({
      content: "Unknown command.",
      flags: ["Ephemeral"],
    });
  }

  try {
    await command.execute(interaction);
    logger.command(
      interaction.commandName,
      interaction.user.id,
      interaction.user.username,
    );
  } catch (err) {
    logger.commandError(
      interaction.commandName,
      interaction.user.id,
      interaction.user.username,
      err,
    );
    await interaction.reply({
      content: "Error executing command",
      flags: ["Ephemeral"],
    });
  }
});

client.on("clientReady", () => {
  logger.info(`Bot logged in as ${client.user.tag}`);

  setInterval(() => {
    cache.checkNotifications(client);
  }, 60000);
});

logger.info("Starting bot...");
client.login(process.env.DISCORD_TOKEN);
