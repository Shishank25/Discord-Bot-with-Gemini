import { EmbedBuilder } from 'discord.js';
import commandHandler from '../handlers/commandHandler.js';

export default {
  name: 'help',
  description: 'Show all available commands or detailed info about one command',
  aliases: ['h', 'commands'],
  usage: '!help [command]',

  async execute(message, args) {

    const allCommands = commandHandler.getAllCommands();

    // 🔎 Specific command help
    if (args.length > 0) {
      const input = args[0].toLowerCase();
      const command = commandHandler.getCommand(input);

      if (!command) {
        return message.reply('❌ That command does not exist.');
      }

      const embed = new EmbedBuilder()
        .setColor(0x00AEFF)
        .setTitle(`📖 Command: ${command.name}`)
        .addFields(
          {
            name: 'Description',
            value: command.description || 'No description provided.',
          },
          {
            name: 'Usage',
            value: command.usage || 'No usage info.',
          },
          {
            name: 'Aliases',
            value: command.aliases?.length
              ? command.aliases.join(', ')
              : 'None',
          }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // 📜 Show all commands
    const embed = new EmbedBuilder()
      .setColor(0x00AEFF)
      .setTitle('🤖 Bot Commands')
      .setDescription('Here is a list of all available commands:')
      .setTimestamp();

    const commandList = allCommands
      .map(cmd => `**${cmd.name}** — ${cmd.description}`)
      .join('\n');

    embed.addFields({
      name: '📜 Commands',
      value: commandList || 'No commands loaded.',
    });

    embed.setFooter({
      text: 'Use !help <command> for more details.',
    });

    return message.reply({ embeds: [embed] });
  },
};
