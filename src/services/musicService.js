import {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  StreamType,
} from '@discordjs/voice';
import ytdl from '@distube/ytdl-core';
import yts from 'yt-search';
import path from 'path';
import { spawn } from 'child_process';

class MusicService {
  constructor() {
    this.queues = new Map(); // Server-specific queues
  }

  /**
   * Get or create a queue for a guild
   */
  getQueue(guildId) {
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, {
        songs: [],
        player: createAudioPlayer(),
        connection: null,
        isPlaying: false,
        currentSong: null,
      });
    }
    return this.queues.get(guildId);
  }

  /**
   * Join a voice channel
   */
  async joinChannel(channel) {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    const queue = this.getQueue(channel.guild.id);
    queue.connection = connection;

    connection.on(VoiceConnectionStatus.Disconnected, () => {
      this.leaveChannel(channel.guild.id);
    });

    return connection;
  }

  /**
   * Leave a voice channel
   */
  leaveChannel(guildId) {
    const queue = this.getQueue(guildId);
    if (queue.connection) {
      queue.connection.destroy();
    }
    this.queues.delete(guildId);
  }

  /**
   * Add a song to the queue
   */
  async addSong(guildId, query, requestedBy) {
    try {
      console.log('[MUSIC] Searching for:', query);

      // Check if it's already a YouTube URL
      let url = query;
      let title = query;
      let duration = 0;

      if (ytdl.validateURL(query)) {
        // It's a direct YouTube URL
        console.log('[MUSIC] Direct URL provided');
        try {
          const info = await ytdl.getInfo(query);
          title = info.videoDetails.title;
          duration = parseInt(info.videoDetails.lengthSeconds);
        } catch (error) {
          console.error('[MUSIC] Error getting video info:', error.message);
          throw new Error('Could not get video information. Video may be unavailable or age-restricted.');
        }
      } else {
        // Search YouTube
        console.log('[MUSIC] Searching YouTube...');
        const searchResults = await yts(query);
        const video = searchResults.videos[0];
        
        if (!video) {
          throw new Error('No results found');
        }

        url = video.url;
        title = video.title;
        duration = video.seconds;
      }

      const song = {
        title: title,
        url: url,
        duration: duration,
        requestedBy: requestedBy,
      };

      console.log('[MUSIC] Song found:', { title, url: url.substring(0, 50) + '...' });

      const queue = this.getQueue(guildId);
      queue.songs.push(song);

      return song;
    } catch (error) {
      console.error('[MUSIC] Error adding song:', error);
      throw error;
    }
  }

  /**
   * Play the next song in the queue
   */
  async playNext(guildId) {
    console.log("Working dir:", process.cwd());

    const queue = this.getQueue(guildId);

    if (queue.songs.length === 0) {
      queue.isPlaying = false;
      queue.currentSong = null;
      console.log('[MUSIC] Queue empty');
      return null;
    }

    const song = queue.songs.shift();
    queue.currentSong = song;
    queue.isPlaying = true;

    console.log('[MUSIC] Now playing:', song.title);
    const cookiePath = path.join(process.cwd(), 'cookies.txt');
    console.log("Cookie path:", cookiePath);    
    
    try {
      // Spawn yt-dlp process
      const ytDlpProcess = spawn('C:\\yt-dlp\\yt-dlp.exe', [
        '-f', 'bestaudio',
        '--no-playlist',
        '--cookies', cookiePath,
        '--js-runtimes', `node:${process.execPath}`,
        '-o', '-',
        song.url
      ]);

      ytDlpProcess.stderr.on('data', data => {
        console.error('[yt-dlp error]', data.toString());
      });

      const resource = createAudioResource(ytDlpProcess.stdout, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true,
      });

      queue.player.play(resource);
      queue.connection.subscribe(queue.player);

      queue.player.once(AudioPlayerStatus.Idle, () => {
        console.log('[MUSIC] Song finished');
        this.playNext(guildId);
      });

      queue.player.on('error', error => {
        console.error('[PLAYER ERROR]', error.message);
        this.playNext(guildId);
      });

      return song;

    } catch (error) {
      console.error('[MUSIC] Playback error:', error);
      queue.isPlaying = false;
      return null;
    }
  }


  /**
   * Pause playback
   */
  pause(guildId) {
    const queue = this.getQueue(guildId);
    if (queue.player) {
      queue.player.pause();
      return true;
    }
    return false;
  }

  /**
   * Resume playback
   */
  resume(guildId) {
    const queue = this.getQueue(guildId);
    if (queue.player) {
      queue.player.unpause();
      return true;
    }
    return false;
  }

  /**
   * Skip current song
   */
  skip(guildId) {
    const queue = this.getQueue(guildId);
    if (queue.player) {
      queue.player.stop();
      return true;
    }
    return false;
  }

  /**
   * Get current queue
   */
  getQueueInfo(guildId) {
    const queue = this.getQueue(guildId);
    return {
      currentSong: queue.currentSong,
      queue: queue.songs,
      isPlaying: queue.isPlaying,
    };
  }

  moveUp(guildId, index) {
    const queue = this.getQueue(guildId);
    if (index <= 0 || index >= queue.songs.length) return false;

    [queue.songs[index - 1], queue.songs[index]] =
      [queue.songs[index], queue.songs[index - 1]];

    return true;
  }

  moveDown(guildId, index) {
    const queue = this.getQueue(guildId);
    if (index < 0 || index >= queue.songs.length - 1) return false;

    [queue.songs[index], queue.songs[index + 1]] =
      [queue.songs[index + 1], queue.songs[index]];

    return true;
  }

  removeSong(guildId, index) {
    const queue = this.getQueue(guildId);
    if (index < 0 || index >= queue.songs.length) return false;

    queue.songs.splice(index, 1);
    return true;
  }
}

export default new MusicService();