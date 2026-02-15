import musicService from '../services/musicService.js';

export default {
  name: 'skip',
  description: 'Skip the current song',
  aliases: ['next'],
  usage: '!skip',
  
  async execute(message, args) {
    try {
      const success = musicService.skip(message.guild.id);
      if (success) {
        await message.reply('⏭️ Skipped the current song!');
      } else {
        await message.reply('❌ Nothing is currently playing.');
      }
    } catch (error) {
      console.error('Skip command error:', error);
      await message.reply('❌ Failed to skip the song.');
    }
  },
};