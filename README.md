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

## Production Deployment (Hostinger)

### Prerequisites

1. **Hostinger VPS/Cloud Hosting** with SSH access (Node.js support required)
2. **GitHub Repository** with this code
3. **Discord Bot Token** and credentials

### Hostinger Setup

1. **Connect to your Hostinger server via SSH**

2. **Install Node.js and npm** (if not already installed):

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Install PM2 globally**:

```bash
sudo npm install -g pm2
```

4. **Create deployment directory**:

```bash
mkdir -p /home/your-username/arc-bot
```

5. **Generate SSH key for GitHub Actions** (on your local machine):

```bash
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
# Save as id_rsa_github_actions (no passphrase)
```

### GitHub Secrets Setup

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

```
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-application-id

HOSTINGER_HOST=your-hostinger-server-ip
HOSTINGER_USERNAME=your-ssh-username
HOSTINGER_SSH_KEY=your-private-ssh-key-content
HOSTINGER_PORT=22
HOSTINGER_DEPLOY_PATH=/home/your-username/arc-bot
```

### Deployment Process

1. **Push to production branch**:

```bash
git checkout -b production
git push origin production
```

2. **GitHub Actions will automatically**:
   - Install dependencies
   - Create `.env` file with secrets
   - Deploy code to Hostinger via SSH
   - Start/restart bot with PM2

3. **Monitor the bot**:

```bash
# SSH into your Hostinger server
ssh your-username@your-host
cd /home/your-username/arc-bot/current

# Check PM2 status
pm2 status

# View logs
pm2 logs arc-bot

# Restart if needed
pm2 restart arc-bot
```

### PM2 Management Commands

```bash
# Start bot
npm run pm2:start

# Stop bot
npm run pm2:stop

# Restart bot
npm run pm2:restart

# View logs
npm run pm2:logs

# Monitor processes
npm run pm2:monit

# Delete process
npm run pm2:delete
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

## Troubleshooting

### Bot not responding

```bash
# Check if PM2 process is running
pm2 status

# Check logs
pm2 logs arc-bot

# Restart bot
pm2 restart arc-bot
```

### Commands not registering

```bash
# Run deploy script on server
cd /home/your-username/arc-bot/current
npm run deploy
```

### Permission issues

- Ensure SSH key has proper permissions: `chmod 600 ~/.ssh/id_rsa_github_actions`
- Check that deployment directory is writable by your SSH user

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
