import { readdirSync } from 'fs';
import { pathToFileURL } from 'url';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
  }

  async loadCommands() {
    const commandsPath = join(__dirname, '../commands');
    const commandFiles = readdirSync(commandsPath).filter(f => f.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      const fileUrl = pathToFileURL(filePath).href;
      const command = await import(fileUrl);
      
      if (command.default?.name) {
        this.commands.set(command.default.name, command.default);
        
        command.default.aliases?.forEach(alias => {
          this.aliases.set(alias, command.default.name);
        });
        
        console.log(`[CMDHNDLR] Loaded command: ${command.default.name}`);
      }
    }

    console.log(`\n[CMDHNDLR] Loaded ${this.commands.size} commands`);
  }

  getCommand(nameOrAlias) {
    if (this.commands.has(nameOrAlias)) {
      return this.commands.get(nameOrAlias);
    }
    
    const commandName = this.aliases.get(nameOrAlias);
    return commandName ? this.commands.get(commandName) : null;
  }

  async executeCommand(message, commandName, args) {
    console.log("[CMDHNDLR] Trying command:", commandName);
    const command = this.getCommand(commandName);
    
    if (!command) return false;

    try {
      if (command.requiresVoice && !message.member.voice.channel) {
        await message.reply(':disappointed: You need to be in a voice channel!');
        return true;
      }

      await command.execute(message, args);
      return true;
    } catch (error) {
      console.error(`:disappointed: Error executing ${commandName}:`, error);
      await message.reply(':disappointed: An error occurred!');
      return true;
    }
  }

  getAllCommands() {
    return Array.from(this.commands.values());
  }
}

export default new CommandHandler();