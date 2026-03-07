module.exports = {
  apps: [
    {
      name: "arc-bot",
      script: "index.js",
      cwd: "/var/www/arc-bot",
      watch: false,
      interpreter: "/usr/bin/node",
      env: {
        NODE_ENV: "production",
        DISCORD_TOKEN: process.env.DISCORD_TOKEN,
        CLIENT_ID: process.env.CLIENT_ID,
        GUILD_ID: process.env.GUILD_ID,
      },
    },
  ],
};
