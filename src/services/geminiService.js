import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.gemini.model });
    this.conversationHistory = new Map();
  }

  async generateResponse(prompt, userId = null, useHistory = true) {
    try {
      if (useHistory && userId) {
        const chat = this.getOrCreateChat(userId);
        const result = await chat.sendMessage(prompt);
        return result.response.text();
      } else {
        const result = await this.model.generateContent(prompt);
        return result.response.text();
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  getOrCreateChat(userId) {
    if (!this.conversationHistory.has(userId)) {
      const chat = this.model.startChat({
        history: [],
        generationConfig: { maxOutputTokens: 500 },
      });
      this.conversationHistory.set(userId, chat);
    }
    return this.conversationHistory.get(userId);
  }

  clearHistory(userId) {
    this.conversationHistory.delete(userId);
  }
}

export default new GeminiService();