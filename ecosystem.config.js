module.exports = {
  apps: [
    {
      name: "arc-bot",
      script: "./index.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
      error_file: "./logs/pm2/error.log",
      out_file: "./logs/pm2/out.log",
      merge_logs: true,
    },
  ],
};
