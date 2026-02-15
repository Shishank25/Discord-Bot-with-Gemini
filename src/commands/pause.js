import musicService from '../services/musicService.js';

export default {
  name: 'pause',
  description: 'Pause the current song',
  aliases: ['stop'],
  usage: '!pause',
  
  async execute(message, args) {
    try {
      const success = musicService.pause(message.guild.id);
      if (success) {
        await message.reply(' Paused the music!');
      } else {
        await message.reply(':disappointed: Nothing is currently playing.');
      }
    } catch (error) {
      console.error('[PAUSE] Pause command error:', error);
      await message.reply(':disappointed: Failed to pause the music.');
    }
  },
};