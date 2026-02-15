import { ActivityType } from 'discord.js';
import { config } from '../config.js';

export default {
  name: 'clientReady',
  once: true,
  
  async execute(client) {
    console.log('\n=================================');
    console.log(`[BOT_READY] Logged in as ${client.user.tag}`);
    console.log(`[BOT_READY] Serving ${client.guilds.cache.size} servers`);
    console.log('=================================\n');

    client.user.setActivity(`${config.discord.prefix}help`, {
      type: ActivityType.Listening,
    });
  },
};