import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import commandHandler from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
import reminderService from './services/reminderService.js';
import ttsService from './services/ttsService.js';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is alive!');
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Setup reminder callbacks
reminderService.onTrigger(async (reminder) => {
  try {
    const channel = client.channels.cache.get(reminder.channelId);
    if (channel) {
      await channel.send(
        `⏰ <@${reminder.userId}> Reminder: **${reminder.message}**`
      );
    }

    // Voice announcement if applicable
    if (reminder.voiceChannelId) {
      const guild = client.guilds.cache.get(reminder.guildId);
      const member = guild?.members.cache.get(reminder.userId);
      
      if (member?.voice.channel?.id === reminder.voiceChannelId) {
        const voiceChannel = guild.channels.cache.get(reminder.voiceChannelId);
        if (!ttsService.isConnected(reminder.guildId)) {
          await ttsService.joinChannel(voiceChannel);
        }
        await ttsService.speak(reminder.guildId, `Reminder: ${reminder.message}`);
        setTimeout(() => ttsService.leaveChannel(reminder.guildId), 2000);
      }
    }
  } catch (error) {
    console.error('Reminder trigger error:', error);
  }
});

async function start() {
  console.log('[MAIN] Starting Discord Bot...\n');

  try {
    console.log('[MAIN] Loading commands...');
    await commandHandler.loadCommands();
    console.log('');

    console.log('[MAIN] Loading events...');
    await loadEvents(client);
    console.log('');

    console.log('[MAIN] Logging in...');
    await client.login(config.discord.token);
  } catch (error) {
    console.error('[MAIN] Failed to start:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('\n[MAIN] Shutting down...');
  client.destroy();
  process.exit(0);
});

start();