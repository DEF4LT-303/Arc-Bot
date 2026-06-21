const os = require("os");
const fs = require("fs");
const { execSync } = require("child_process");
const { EmbedBuilder } = require("discord.js");

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
const STATE_FILE = "./vpsMonitorState.json";

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE))
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch (_) {}
  return {};
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isLinux = os.platform() === "linux";
const isWin = os.platform() === "win32";

function safe(fn, fallback = null) {
  try {
    return fn();
  } catch (_) {
    return fallback;
  }
}

function toMB(bytes) {
  return Math.round(bytes / 1024 / 1024);
}
function toGB(bytes) {
  return (bytes / 1024 / 1024 / 1024).toFixed(2);
}
function mbToGB(mb) {
  return (mb / 1024).toFixed(2);
}

/** Clamped progress bar — matches the style in the screenshot */
function bar(percent, length = 16) {
  const p = Math.max(0, Math.min(100, percent || 0));
  const filled = Math.round((p / 100) * length);
  return "▓".repeat(filled) + "░".repeat(length - filled);
}

function statusColor(values) {
  const max = Math.max(...values.filter((v) => v != null && !isNaN(v)));
  if (max >= 90) return 0xed4245;
  if (max >= 70) return 0xfee75c;
  return 0x57f287;
}

function fmtUptime(s) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// CPU
// ---------------------------------------------------------------------------

function getCpuStats() {
  return new Promise((resolve) => {
    const snap = (cpus) =>
      cpus.map((c) => {
        const total = Object.values(c.times).reduce((a, b) => a + b, 0);
        return { idle: c.times.idle, total };
      });

    const s1 = snap(os.cpus());
    setTimeout(() => {
      const s2 = snap(os.cpus());
      let idleSum = 0,
        totalSum = 0;
      const perCore = s1.map((a, i) => {
        const b = s2[i];
        const dt = b.total - a.total || 1;
        const di = b.idle - a.idle;
        idleSum += di;
        totalSum += dt;
        return Math.max(0, Math.min(100, Math.round(((dt - di) / dt) * 100)));
      });
      const percent = Math.round(
        ((totalSum - idleSum) / (totalSum || 1)) * 100,
      );
      resolve({ percent, perCore });
    }, 600);
  });
}

// ---------------------------------------------------------------------------
// RAM & Swap
// ---------------------------------------------------------------------------

function getMemInfo() {
  if (isLinux) {
    return safe(() => {
      const raw = fs.readFileSync("/proc/meminfo", "utf8");
      const get = (key) => {
        const m = raw.match(new RegExp(`^${key}:\\s+(\\d+)`, "m"));
        return m ? parseInt(m[1], 10) * 1024 : 0;
      };
      const memTotal = get("MemTotal");
      const memFree = get("MemFree");
      const buffers = get("Buffers");
      const cached = get("Cached");
      const sReclaimable = get("SReclaimable");
      const memUsed = memTotal - memFree - buffers - cached - sReclaimable;
      const swapTotal = get("SwapTotal");
      const swapFree = get("SwapFree");
      const swapUsed = swapTotal - swapFree;
      return {
        ram: {
          totalMB: toMB(memTotal),
          usedMB: toMB(memUsed),
          freeMB: toMB(memFree + buffers + cached + sReclaimable),
          percent: Math.round((memUsed / (memTotal || 1)) * 100),
        },
        swap: {
          totalMB: toMB(swapTotal),
          usedMB: toMB(swapUsed),
          freeMB: toMB(swapFree),
          percent: swapTotal > 0 ? Math.round((swapUsed / swapTotal) * 100) : 0,
          exists: swapTotal > 0,
        },
      };
    });
  }
  // Windows fallback
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    ram: {
      totalMB: toMB(total),
      usedMB: toMB(used),
      freeMB: toMB(free),
      percent: Math.round((used / total) * 100),
    },
    swap: { totalMB: 0, usedMB: 0, freeMB: 0, percent: 0, exists: false },
  };
}

// ---------------------------------------------------------------------------
// Disk
// ---------------------------------------------------------------------------

function getDiskStats() {
  return (
    safe(() => {
      if (isWin) {
        const raw = execSync(
          "wmic logicaldisk where \"DeviceID='C:'\" get FreeSpace,Size /format:csv",
          { timeout: 5000 },
        )
          .toString()
          .trim();
        const lines = raw
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const parts = lines[lines.length - 1].split(",");
        const free = parseInt(parts[1], 10);
        const total = parseInt(parts[2], 10);
        if (isNaN(free) || isNaN(total) || total === 0) return [];
        const used = total - free;
        return [
          {
            mount: "C:",
            totalMB: toMB(total),
            usedMB: toMB(used),
            freeMB: toMB(free),
            percent: Math.round((used / total) * 100),
          },
        ];
      }
      const raw = execSync(
        "df -BM --output=target,size,used,avail,pcent 2>/dev/null | tail -n +2",
        { timeout: 5000 },
      )
        .toString()
        .trim();
      return raw
        .split("\n")
        .map((line) => {
          const p = line.trim().split(/\s+/);
          if (p.length < 5) return null;
          const mount = p[0];
          if (
            ["/proc", "/sys", "/dev", "/run", "/snap"].some((x) =>
              mount.startsWith(x),
            )
          )
            return null;
          const parse = (s) => parseInt(s.replace("M", ""), 10);
          return {
            mount,
            totalMB: parse(p[1]),
            usedMB: parse(p[2]),
            freeMB: parse(p[3]),
            percent: parseInt(p[4], 10),
          };
        })
        .filter(Boolean)
        .slice(0, 3);
    }) ?? []
  );
}

// ---------------------------------------------------------------------------
// Network — live speed (delta) + totals
// ---------------------------------------------------------------------------

let _prevNet = null;
let _prevNetTime = null;

function readNetRaw() {
  if (!isLinux) return null;
  return safe(() => {
    const raw = fs.readFileSync("/proc/net/dev", "utf8");
    let rx = 0,
      tx = 0;
    for (const line of raw.split("\n").slice(2)) {
      const p = line.trim().split(/\s+/);
      if (p.length < 10) continue;
      if (p[0].replace(":", "") === "lo") continue;
      rx += parseInt(p[1], 10) || 0;
      tx += parseInt(p[9], 10) || 0;
    }
    return { rx, tx };
  });
}

function getNetworkStats() {
  const now = Date.now();
  const curr = readNetRaw();
  let rxMBs = null;
  let txMBs = null;

  if (curr && _prevNet && _prevNetTime) {
    const dt = (now - _prevNetTime) / 1000 || 1;
    rxMBs = Math.max(0, (curr.rx - _prevNet.rx) / dt / 1024 / 1024);
    txMBs = Math.max(0, (curr.tx - _prevNet.tx) / dt / 1024 / 1024);
  }

  _prevNet = curr;
  _prevNetTime = now;

  return {
    rxMBs: rxMBs !== null ? rxMBs.toFixed(2) : null,
    txMBs: txMBs !== null ? txMBs.toFixed(2) : null,
    totalRxGB: curr ? (curr.rx / 1024 / 1024 / 1024).toFixed(2) : null,
    totalTxGB: curr ? (curr.tx / 1024 / 1024 / 1024).toFixed(2) : null,
  };
}

// ---------------------------------------------------------------------------
// Build embed — styled like the reference screenshot
// ---------------------------------------------------------------------------

async function buildEmbed() {
  const cpu = await getCpuStats();
  const mem = getMemInfo();
  const ram = mem.ram;
  const swap = mem.swap;
  const disk = getDiskStats();
  const net = getNetworkStats();
  const load = os
    .loadavg()
    .map((v) => v.toFixed(2))
    .join(" / ");

  const embed = new EmbedBuilder()
    .setTitle("🖥️  Monitoring VPS Server")
    .setDescription("**Live system information**")
    .setColor(statusColor([cpu.percent, ram.percent, swap?.percent]))
    .setTimestamp()
    .setFooter({
      text: `${os.hostname()}  •  Uptime: ${fmtUptime(os.uptime())}  •  Updates every ${UPDATE_INTERVAL_MS / 1000}s`,
    });

  // ── Total CPU Load ────────────────────────────────────────────────────────
  embed.addFields({
    name: "〽️  Total CPU Load",
    value: `\`[${bar(cpu.percent)}]\` ${cpu.percent.toFixed(2)}%\nLoad avg: \`${load}\``,
    inline: false,
  });

  // ── CPU Cores ─────────────────────────────────────────────────────────────
  const coreLines = cpu.perCore
    .slice(0, 8)
    .map(
      (p, i) =>
        `C${String(i).padStart(2, "0")}  \`[${bar(p)}]\` ${p.toFixed(2)}%`,
    )
    .join("\n");
  embed.addFields({
    name: "📊  CPU Cores",
    value: coreLines || "N/A",
    inline: false,
  });

  // ── RAM ───────────────────────────────────────────────────────────────────
  embed.addFields({
    name: "📈  RAM",
    value: [
      `Used: **${mbToGB(ram.usedMB)} GB** / Free: **${mbToGB(ram.freeMB)} GB** / Total: **${mbToGB(ram.totalMB)} GB**`,
      `Usage: \`[${bar(ram.percent)}]\` ${ram.percent.toFixed(2)}%`,
    ].join("\n"),
    inline: false,
  });

  // ── Swap ──────────────────────────────────────────────────────────────────
  embed.addFields({
    name: "💡  Swap",
    value: [
      `Used: **${mbToGB(swap.usedMB)} GB** / Free: **${mbToGB(swap.freeMB)} GB** / Total: **${mbToGB(swap.totalMB)} GB**`,
      `Usage: \`[${bar(swap.percent)}]\` ${swap.percent.toFixed(2)}%`,
    ].join("\n"),
    inline: false,
  });

  // ── Disk ──────────────────────────────────────────────────────────────────
  if (disk.length) {
    const diskLines = disk
      .map((d) =>
        [
          `**${d.mount}** — Used: **${mbToGB(d.usedMB)} GB** / Free: **${mbToGB(d.freeMB)} GB** / Total: **${mbToGB(d.totalMB)} GB**`,
          `Usage: \`[${bar(d.percent)}]\` ${d.percent.toFixed(2)}%`,
        ].join("\n"),
      )
      .join("\n");

    embed.addFields({ name: "💾  Disk", value: diskLines, inline: false });
  }

  // ── Network ───────────────────────────────────────────────────────────────
  const netLines = [];
  if (net.rxMBs !== null) {
    netLines.push(`↓ **${net.rxMBs} MiB/s**  |  ↑ **${net.txMBs} MiB/s**`);
  } else {
    netLines.push("↓ — MiB/s  |  ↑ — MiB/s  *(calculating...)*");
  }
  if (net.totalRxGB !== null) {
    netLines.push(
      `Total — ↓ **${net.totalRxGB} GB**  |  ↑ **${net.totalTxGB} GB** *(since boot)*`,
    );
  }
  embed.addFields({
    name: "🌐  Network",
    value: netLines.join("\n"),
    inline: false,
  });

  return embed;
}

// ---------------------------------------------------------------------------
// Monitor loop
// ---------------------------------------------------------------------------
let _client = null;
let _intervalId = null;
const UPDATE_INTERVAL_MS = Math.max(
  10_000,
  parseInt(process.env.VPS_MONITOR_INTERVAL ?? "30000", 10),
);

async function tick() {
  const state = loadState();
  if (Object.keys(state).length === 0) return;

  let embed;
  try {
    embed = await buildEmbed();
  } catch (err) {
    console.error("[vpsMonitor] Failed to build embed:", err);
    return;
  }

  for (const [channelId, info] of Object.entries(state)) {
    try {
      const channel = await _client.channels.fetch(channelId).catch(() => null);
      if (!channel) {
        delete state[channelId];
        saveState(state);
        continue;
      }

      if (info.messageId) {
        try {
          const msg = await channel.messages.fetch(info.messageId);
          await msg.edit({ embeds: [embed] });
          continue;
        } catch (_) {
          info.messageId = null;
        }
      }

      const sent = await channel.send({ embeds: [embed] });
      info.messageId = sent.id;
      saveState(state);
    } catch (err) {
      console.error(`[vpsMonitor] Error updating channel ${channelId}:`, err);
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function start(discordClient) {
  _client = discordClient;
  if (_intervalId) return;

  // Pre-sample network so the very first embed has speed data instead of "calculating..."
  _prevNet = readNetRaw();
  _prevNetTime = Date.now();

  // Wait 1s then fire first tick (gives network delta a real sample window)
  setTimeout(() => {
    tick();
    _intervalId = setInterval(tick, UPDATE_INTERVAL_MS);
  }, 1000);

  console.log("[vpsMonitor] Monitor started.");
}

function enableChannel(channelId, guildId) {
  const state = loadState();
  if (state[channelId]) return false;
  state[channelId] = { messageId: null, guildId };
  saveState(state);
  return true;
}

function disableChannel(channelId) {
  const state = loadState();
  if (!state[channelId]) return false;
  delete state[channelId];
  saveState(state);
  return true;
}

function listChannels() {
  return Object.keys(loadState());
}

module.exports = { start, enableChannel, disableChannel, listChannels };
