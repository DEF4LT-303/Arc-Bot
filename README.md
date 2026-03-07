# Arc JS Discord Bot

Simple Discord.js v14 bot with a slash command to search ARC Raiders items.

## Setup

1. Copy `.env.example` -> `.env` and fill in values:

```
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-application-id
GUILD_ID=your-test-guild-id   # use a guild for rapid registration
```

2. Install dependencies:

```bash
npm install
```

3. Register commands with Discord:

```bash
npm run deploy
```

4. Start the bot:

```bash
npm start
```

## Adding Commands

- Create a new file under `commands/` exporting `data` (SlashCommandBuilder) and `execute(interaction)`.
- Run `npm run deploy` after adding or modifying commands.

## Notes

- Use `GUILD_ID` for development; global commands may take up to an hour to appear.
- The bot requires the `applications.commands` OAuth2 scope when invited to a server.

