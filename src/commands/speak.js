import ttsService from '../services/ttsService.js';

export default {
  name: 's',
  description: 'Convert text to speech and play it in voice channel',
  aliases: ['tts', 'say'],
  usage: '!speak <text>',
  requiresVoice: true,
  
  async execute(message, args) {
    if (args.length === 0) {
      return message.reply(':disappointed: Please provide text to speak! Usage: `!speak <text>`');
    }

    const text = args.join(' ');
    const voiceChannel = message.member.voice.channel;

    // Limit text length
    if (text.length > 200) {
      return message.reply(':disappointed: Text is too long! Maximum 200 characters.');
    }

    try {
      // Join voice channel if not already connected
      if (!ttsService.isConnected(message.guild.id)) {
        await ttsService.joinChannel(voiceChannel);
      }

      await message.reply('🔊 Speaking...');
      await ttsService.speak(message.guild.id, text);
    } catch (error) {
      console.error('Speak command error:', error);
      await message.reply(':disappointed: Failed to speak the text.');
    }
  },
};