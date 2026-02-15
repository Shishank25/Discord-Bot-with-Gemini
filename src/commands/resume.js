import musicService from '../services/musicService.js';

export default {
  name: 'resume',
  description: 'Resume the paused song',
  aliases: ['unpause', 'continue'],
  usage: '!resume',
  
  async execute(message, args) {
    try {
      const success = musicService.resume(message.guild.id);
      if (success) {
        await message.reply('▶️ Resumed the music!');
      } else {
        await message.reply('❌ Nothing is currently paused.');
      }
    } catch (error) {
      console.error('Resume command error:', error);
      await message.reply('❌ Failed to resume the music.');
    }
  },
};