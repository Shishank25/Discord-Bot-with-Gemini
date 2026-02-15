import {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
} from '@discordjs/voice';
import { writeFile, unlink } from 'fs/promises';

class TTSService {
  constructor() {
    this.activeConnections = new Map();
  }

  async joinChannel(channel) {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    this.activeConnections.set(channel.guild.id, connection);
    return connection;
  }

  leaveChannel(guildId) {
    const connection = this.activeConnections.get(guildId);
    if (connection) {
      connection.destroy();
      this.activeConnections.delete(guildId);
    }
  }

  async generateTTS(text, language = 'en') {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${language}&client=tw-ob&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to generate TTS');
    }

    return Buffer.from(await response.arrayBuffer());
  }

  async speak(guildId, text, language = 'en') {
    return new Promise(async (resolve, reject) => {
      const connection = this.activeConnections.get(guildId);
      
      if (!connection) {
        reject(new Error('Not connected to voice channel'));
        return;
      }

      const filename = `/tmp/tts_${guildId}_${Date.now()}.mp3`;

      try {
        const audioBuffer = await this.generateTTS(text, language);
        await writeFile(filename, audioBuffer);

        const player = createAudioPlayer();
        const resource = createAudioResource(filename);

        player.play(resource);
        connection.subscribe(player);

        player.once(AudioPlayerStatus.Idle, async () => {
          await unlink(filename).catch(() => {});
          resolve();
        });

        player.on('error', async (error) => {
          await unlink(filename).catch(() => {});
          reject(error);
        });
      } catch (error) {
        await unlink(filename).catch(() => {});
        reject(error);
      }
    });
  }

  isConnected(guildId) {
    return this.activeConnections.has(guildId);
  }
}

export default new TTSService();