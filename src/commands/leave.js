import musicService from '../services/musicService.js';

export default {
  name: 'leave',
  description: 'Make the bot leave the voice channel',
  aliases: ['disconnect', 'dc'],
  usage: '!leave',
  
  async execute(message, args) {
    try {
      musicService.leaveChannel(message.guild.id);
      await message.reply('✅ Left the voice channel!');
    } catch (error) {
      console.error('[LEAVE] Leave command error:', error);
      await message.reply(':disappointed: Failed to leave the voice channel.');
    }
  },
};