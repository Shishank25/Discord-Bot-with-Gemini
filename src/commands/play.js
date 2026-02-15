import musicService from '../services/musicService.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';

export default {
  name: 'play',
  description: 'Play a song',
  aliases: ['p'],
  usage: '!play <song name>',
  requiresVoice: true,
  
  async execute(message, args) {
    if (args.length === 0) {
      return message.reply(':disappointed: Please provide a song name!');
    }

    const query = args.join(' ');
    const voiceChannel = message.member.voice.channel;

    try {
      const queue = musicService.getQueue(message.guild.id);
      if (!queue.connection) {
        await musicService.joinChannel(voiceChannel);
      }

      console.log("[PLAY] Connected");

      const song = await musicService.addSong(
        message.guild.id,
        query,
        message.author.tag
      );

      console.log("[PLAY] Song Added");

      const queueInfo = musicService.getQueueInfo(message.guild.id);
      console.log("[PLAY] Queue Info: ", queueInfo);
      if (!queueInfo.isPlaying) {
        const nowPlaying = await musicService.playNext(message.guild.id);

        // Create buttons
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

        const playerMessage = await message.reply({
          content: `🎵 **Now Playing:** ${nowPlaying.title}\n👤 Requested by: ${nowPlaying.requestedBy}`,
          components: [row],
        });

        const collector = playerMessage.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 1000 * 60 * 10, // 10 minutes
        });

        collector.on('collect', async interaction => {
          if (interaction.user.id !== message.author.id) {
            return interaction.reply({
              content: '❌ Only the person who started the music can control it!',
              ephemeral: true,
            });
          }

          switch (interaction.customId) {
            case 'pause':
              musicService.pause(message.guild.id);
              await interaction.update({ content: '⏸ Paused', components: [row] });
              break;

            case 'resume':
              musicService.resume(message.guild.id);
              await interaction.update({ content: `▶ Resumed: ${nowPlaying.title}`, components: [row] });
              break;

            case 'skip':
              musicService.skip(message.guild.id);
              await interaction.update({ content: '⏭ Skipped!', components: [] });
              break;

            case 'stop':
              musicService.leaveChannel(message.guild.id);
              await interaction.update({ content: '⏹ Stopped and left channel.', components: [] });
              collector.stop();
              break;
          }
        });

        collector.on('end', async () => {
          try {
            await playerMessage.edit({ components: [] });
          } catch {}
        });
      } else {
        await message.reply(`✅ Added to queue: **${song.title}**`);
      }
    } catch (error) {
      console.error("[PLAY] Error playing song: ", error);
      await message.reply(':disappointed: Failed to play song.');
    }
  },
};