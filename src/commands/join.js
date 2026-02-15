import musicService from '../services/musicService.js';

export default {
  name: 'join',
  description: 'Make the bot join your voice channel',
  aliases: ['connect'],
  usage: '!join',
  requiresVoice: true,
  
  async execute(message, args) {
    const voiceChannel = message.member.voice.channel;

    try {
      await musicService.joinChannel(voiceChannel);
      await message.reply(`✅ Joined **${voiceChannel.name}**!`);
    } catch (error) {
      console.error('[JOIN] Join command error:', error);
      await message.reply(':disappointed: Failed to join the voice channel.');
    }
  },
};