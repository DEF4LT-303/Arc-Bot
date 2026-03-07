# Arc JS Discord Bot

Simple Discord.js v14 bot with slash commands for ARC Raiders game data.

## Features

- **Item Search** - Search items with autocomplete
- **Quest Search** - Find quests with autocomplete
- **Event Timers** - View map events and schedules
- **Help Command** - Complete command guide
- **Caching** - Hourly data refresh for fast responses
- **Logging** - Command usage tracking

## Local Development

1. Copy `.env.example` -> `.env` and fill in values:

```
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-application-id
```

2. Install dependencies:

```bash
npm install
```

3. Register slash commands (global - available in all servers):

```bash
npm run deploy
```

4. Start the bot:

```bash
npm start
```

## Available Commands

- `/item name:` - Search items with autocomplete
- `/quest name:` - Search quests with autocomplete
- `/events [map:]` - View event timers (all maps or specific map)
- `/help` - Show command help

## Data Sources

- Items, quests, and events from [MetaForge ARC Raiders API](https://metaforge.app/arc-raiders/api)
- Data cached hourly for performance
- All logs saved to `/logs/` directory

## Notes

- Commands are registered **globally** - automatically available in all servers where the bot is invited
- Global command registration is instant after `npm run deploy`
- The bot requires the `applications.commands` OAuth2 scope when invited to servers
- Simply invite the bot to any Discord server and commands will be available immediately

## Support

For issues with:

- **Bot functionality**: Check logs and Discord.js documentation
- **Hostinger hosting**: Contact Hostinger support
- **GitHub Actions**: Check Actions tab in your repository
- **ARC Raiders API**: Visit [MetaForge Discord](https://discord.gg/8UEK9TrQDs)
