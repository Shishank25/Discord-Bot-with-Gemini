import dotenv from 'dotenv';
dotenv.config();

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    prefix: process.env.PREFIX || '!',
    ownerId: process.env.BOT_OWNER_ID,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-3-flash-preview',
  },
  features: {
    music: true,
    tts: true,
    reminders: true,
    ai: true,
  },
};

// Validate required environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'GEMINI_API_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`[CONFIG] Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('[CONFIG] Please check your .env file');
  process.exit(1);
}