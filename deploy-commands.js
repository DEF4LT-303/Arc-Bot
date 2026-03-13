require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

if (
  !process.env.DISCORD_TOKEN ||
  !process.env.CLIENT_ID ||
  !process.env.GUILD_ID
) {
  console.error(
    "Please set DISCORD_TOKEN, CLIENT_ID, and GUILD_ID in your .env file.",
  );
  process.exit(1);
}

// Load commands
const allCommands = [];
const commandFiles = fs.readdirSync(path.join(__dirname, "commands"));
for (const file of commandFiles) {
  const cmd = require(path.join(__dirname, "commands", file));
  if (cmd.data) allCommands.push(cmd.data.toJSON());
}

const devCommands = allCommands.filter((cmd) =>
  cmd.description.includes("[DEV ONLY]"),
);
const publicCommands = allCommands.filter(
  (cmd) => !cmd.description.includes("[DEV ONLY]"),
);

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Registering commands for test guild…");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID,
      ),
      { body: allCommands },
    );
    console.log(
      `✅ Registered ${allCommands.length} commands in guild ${process.env.GUILD_ID}`,
    );

    console.log("Registering global commands…");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: publicCommands,
    });
    console.log(`✅ Registered ${publicCommands.length} global commands`);
  } catch (err) {
    console.error("Failed to register commands", err);
  } finally {
    process.exit(0);
  }
})();
