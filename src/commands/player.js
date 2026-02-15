import musicService from '../services/musicService.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType
} from 'discord.js';

export default {
  name: 'p',
  description: 'Open the music player controller',
  aliases: ['player', 'controls'],
  usage: '!p',

  async execute(message) {
    const guildId = message.guild.id;
    const queueInfo = musicService.getQueueInfo(guildId);

    if (!queueInfo.currentSong) {
      return message.reply('🎵 Nothing is playing right now.');
    }

    const embed = new EmbedBuilder()
      .setColor(0x00FF99)
      .setTitle('🎶 Music Player')
      .addFields({
        name: '▶️ Now Playing',
        value: `**${queueInfo.currentSong.title}**\nRequested by: ${queueInfo.currentSong.requestedBy}`,
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('pause')
        .setLabel('⏸')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('resume')
        .setLabel('▶')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('skip')
        .setLabel('⏭')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('stop')
        .setLabel('⏹')
        .setStyle(ButtonStyle.Danger),
    );

    const controllerMessage = await message.reply({
      embeds: [embed],
      components: [row],
    });

    const collector = controllerMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 1000 * 60 * 10,
    });

    collector.on('collect', async interaction => {
      if (!interaction.member.voice.channel) {
        return interaction.reply({
          content: '❌ You must be in a voice channel!',
          ephemeral: true,
        });
      }

      switch (interaction.customId) {
        case 'pause':
          musicService.pause(guildId);
          await interaction.reply({ content: '⏸ Paused', ephemeral: true });
          break;

        case 'resume':
          musicService.resume(guildId);
          await interaction.reply({ content: '▶ Resumed', ephemeral: true });
          break;

        case 'skip':
          musicService.skip(guildId);
          await interaction.reply({ content: '⏭ Skipped', ephemeral: true });
          break;

        case 'stop':
          musicService.leaveChannel(guildId);
          await interaction.update({
            content: '⏹ Stopped and left channel.',
            embeds: [],
            components: [],
          });
          collector.stop();
          break;
      }
    });

    collector.on('end', async () => {
      try {
        await controllerMessage.edit({ components: [] });
      } catch {}
    });
  },
};
