import geminiService from '../services/geminiService.js';

export default {
  name: 'ask',
  description: 'Ask the AI a question',
  aliases: ['ai', 'chat'],
  usage: '!ask <question>',
  
  async execute(message, args) {
    if (args.length === 0) {
      return message.reply(':disappointed: Please ask a question!');
    }

    const question = args.join(' ');

    const loadingMessage = await message.reply("🤖 Thinking...");

    try {
      const response = await geminiService.generateResponse(
        question,
        message.author.id,
        true
      );

      if (response.length > 2000) {
        const chunks = response.match(/[\s\S]{1,2000}/g) || [];
        await loadingMessage.edit(chunks.shift());

        for (const chunk of chunks) {
          await message.channel.send(chunk);
        }
      } else {
        await loadingMessage.edit(response);
      }

    } catch (error) {
      console.error(error);
      await loadingMessage.edit(':disappointed: Error processing your request.');
    }
  }

};