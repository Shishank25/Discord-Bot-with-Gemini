import musicService from '../services/musicService.js';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType
} from 'discord.js';

export default {
  name: 'queue',
  description: 'Show the current music queue',
  aliases: ['q', 'list'],
  usage: '!queue',
  
  async execute(message) {
    try {
        const guildId = message.guild.id;
        const queueInfo = musicService.getQueueInfo(guildId);

        if (!queueInfo.currentSong && queueInfo.queue.length === 0) {
        return message.reply('🎵 The queue is empty!');
        }

        const buildEmbed = () => {
        const data = musicService.getQueueInfo(guildId);

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🎵 Music Queue')
            .setTimestamp();

        if (data.currentSong) {
            embed.addFields({
            name: '▶️ Now Playing',
            value: `**${data.currentSong.title}**\nRequested by: ${data.currentSong.requestedBy}`,
            });
        }

        if (data.queue.length > 0) {
            embed.addFields({
            name: `📝 Up Next (${data.queue.length})`,
            value: data.queue
                .slice(0, 10)
                .map((song, i) => `${i + 1}. **${song.title}**`)
                .join('\n'),
            });
        }

        return embed;
        };

        const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select-song')
        .setPlaceholder('Select a song to modify')
        .addOptions(
            queueInfo.queue.slice(0, 25).map((song, index) => ({
            label: song.title.slice(0, 100),
            value: index.toString(),
            }))
        );

        const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('up')
            .setLabel('Up')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('down')
            .setLabel('Down')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('remove')
            .setLabel('Remove')
            .setStyle(ButtonStyle.Danger),
        );

        const row1 = new ActionRowBuilder().addComponents(selectMenu);

        const queueMessage = await message.reply({
        embeds: [buildEmbed()],
        components: [row1, buttons],
        });

        let selectedIndex = null;

        const collector = queueMessage.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 600000,
        });

        const buttonCollector = queueMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 600000,
        });

        collector.on('collect', async interaction => {
        selectedIndex = parseInt(interaction.values[0]);
        await interaction.reply({
            content: `Selected: **${queueInfo.queue[selectedIndex].title}**`,
            ephemeral: true,
        });
        });

        buttonCollector.on('collect', async interaction => {
        if (selectedIndex === null) {
            return interaction.reply({
            content: '⚠️ Select a song first!',
            ephemeral: true,
            });
        }

        if (interaction.customId === 'up') {
            musicService.moveUp(guildId, selectedIndex);

            if (selectedIndex === 0) {
            musicService.skip(guildId); // Play it immediately
            } else {
            selectedIndex--;
            }
        }

        if (interaction.customId === 'down') {
            musicService.moveDown(guildId, selectedIndex);
            selectedIndex++;
        }

        if (interaction.customId === 'remove') {
            musicService.removeSong(guildId, selectedIndex);
            selectedIndex = null;
        }

        await interaction.update({
            embeds: [buildEmbed()],
        });
        });

        collector.on('end', async () => {
        try {
            await queueMessage.edit({ components: [] });
        } catch {}
        });

    } catch (error) {
        console.error(error);
        await message.reply('❌ Failed to display queue.');
    }
    }

};