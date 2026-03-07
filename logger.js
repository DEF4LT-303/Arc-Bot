const fs = require("fs");
const path = require("path");

// Ensure logs directory exists
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const getTimestamp = () => {
  return new Date().toISOString();
};

const logger = {
  command: (commandName, userId, username) => {
    const timestamp = getTimestamp();
    const message = `[${timestamp}] ✅ Command executed: "${commandName}" by ${username} (${userId})`;
    console.log(message);
    logToFile(message);
  },

  commandError: (commandName, userId, username, error) => {
    const timestamp = getTimestamp();
    const message = `[${timestamp}] ❌ Command failed: "${commandName}" by ${username} (${userId}) - Error: ${error.message}`;
    console.error(message);
    logToFile(message);
  },

  unknownCommand: (commandName, userId, username) => {
    const timestamp = getTimestamp();
    const message = `[${timestamp}] ⚠️ Unknown command: "${commandName}" by ${username} (${userId})`;
    console.warn(message);
    logToFile(message);
  },

  info: (message) => {
    const timestamp = getTimestamp();
    const formatted = `[${timestamp}] ℹ️ ${message}`;
    console.log(formatted);
    logToFile(formatted);
  },
};

const logToFile = (message) => {
  const logFile = path.join(
    logsDir,
    `${new Date().toISOString().split("T")[0]}.log`,
  );
  fs.appendFileSync(logFile, message + "\n");
};

module.exports = logger;
