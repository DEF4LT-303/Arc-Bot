const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const monitor = require("../vps-monitor");

const DEV_USER_ID = "305681776427139073";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vpsmonitor")
    .setDescription("Toggle live VPS performance updates in a channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sub) =>
      sub
        .setName("enable")
        .setDescription("Start posting VPS stats in this channel (or another)")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Channel to post in (defaults to current channel)")
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("disable")
        .setDescription("Stop posting VPS stats in this channel (or another)")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription(
              "Channel to stop posting in (defaults to current channel)",
            )
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("List all channels receiving VPS updates"),
    ),

  async execute(interaction) {
    // Only the developer or members with ManageChannels can use this
    const isOwner = interaction.user.id === DEV_USER_ID;
    const hasPerm = interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageChannels,
    );

    if (!isOwner && !hasPerm) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Access Denied")
            .setDescription(
              "You need the **Manage Channels** permission to use this command.",
            )
            .setColor(0xff6b6b),
        ],
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();

    // -----------------------------------------------------------------------
    // /vpsmonitor enable
    // -----------------------------------------------------------------------
    if (sub === "enable") {
      const target =
        interaction.options.getChannel("channel") ?? interaction.channel;

      // Make sure it's a text-based channel
      if (!target.isTextBased()) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Invalid Channel")
              .setDescription("Please choose a text channel.")
              .setColor(0xff6b6b),
          ],
          ephemeral: true,
        });
      }

      const added = monitor.enableChannel(target.id, interaction.guildId);

      if (!added) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("⚠️ Already Enabled")
              .setDescription(
                `VPS monitoring is already active in <#${target.id}>.`,
              )
              .setColor(0xfee75c),
          ],
          ephemeral: true,
        });
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("✅ VPS Monitor Enabled")
            .setDescription(
              `Live VPS stats will now be posted in <#${target.id}> every **60 seconds**.\n\n` +
                `The first update will appear momentarily. Use \`/vpsmonitor disable\` to stop.`,
            )
            .setColor(0x57f287)
            .addFields({
              name: "📊 Metrics tracked",
              value:
                "CPU usage & load avg • RAM • Disk ( / ) • Network I/O • Uptime",
            }),
        ],
      });
    }

    // -----------------------------------------------------------------------
    // /vpsmonitor disable
    // -----------------------------------------------------------------------
    if (sub === "disable") {
      const target =
        interaction.options.getChannel("channel") ?? interaction.channel;
      const removed = monitor.disableChannel(target.id);

      if (!removed) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("⚠️ Not Active")
              .setDescription(
                `VPS monitoring is not running in <#${target.id}>.`,
              )
              .setColor(0xfee75c),
          ],
          ephemeral: true,
        });
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🛑 VPS Monitor Disabled")
            .setDescription(`Stopped posting VPS stats in <#${target.id}>.`)
            .setColor(0xed4245),
        ],
      });
    }

    // -----------------------------------------------------------------------
    // /vpsmonitor status
    // -----------------------------------------------------------------------
    if (sub === "status") {
      const channelIds = monitor.listChannels();

      if (channelIds.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("📋 VPS Monitor Status")
              .setDescription("No channels are currently being monitored.")
              .setColor(0x5865f2),
          ],
          ephemeral: true,
        });
      }

      const list = channelIds.map((id) => `• <#${id}>`).join("\n");

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("📋 VPS Monitor Status")
            .setDescription(`Currently posting VPS updates in:\n\n${list}`)
            .setColor(0x5865f2)
            .setFooter({ text: `${channelIds.length} channel(s) active` }),
        ],
        ephemeral: true,
      });
    }
  },
};
