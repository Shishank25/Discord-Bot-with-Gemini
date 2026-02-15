import { config } from '../config.js';
import commandHandler from '../handlers/commandHandler.js';

export default {
  name: 'messageCreate',
  
  async execute(message) {
    console.log("MESSAGE EVENT TRIGGERED:", message.content);
    if (message.author.bot) return;
    if (!message.content.startsWith(config.discord.prefix)) return;

    const args = message.content
      .slice(config.discord.prefix.length)
      .trim()
      .split(/ +/);
    
    const commandName = args.shift().toLowerCase();

    await commandHandler.executeCommand(message, commandName, args);
  },
};