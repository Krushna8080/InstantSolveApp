import axios from 'axios';
import { API_KEYS, MODELS, API_CONFIG, MODEL_CONFIG } from './constants';

class QuickAnswerService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.primaryModel = MODELS.PHI_3_MINI;
    this.backupModel = MODELS.ZEPHYR;
    this.config = MODEL_CONFIG.QUICK_ANSWER;
    this.systemPrompt = `You are a quick answer expert. Your task is to:
1. Provide immediate, accurate responses
2. Keep answers concise and to the point (max 2-3 sentences when possible)
3. Focus on the most relevant information
4. Use simple, clear language
5. Include key facts or numbers when applicable
6. Avoid unnecessary details or tangents
7. Format responses for easy reading
8. If uncertain, clearly state limitations

For factual queries, provide verified information. For opinions, offer balanced perspectives. For recommendations, suggest practical options.`;
  }

  formatResponse(text) {
    if (!text) return '';

    // First, normalize any existing bold markers to a standard format
    let formattedText = text
      // Convert double asterisks to bold format
      .replace(/\*\*([^*]+)\*\*/g, (match, content) => {
        return `{{bold}}${content.trim()}{{/bold}}`;
      })
      // Convert {bold} to {{bold}} format if present
      .replace(/\{bold\}([^}]+)\{\/bold\}/g, (match, content) => {
        return `{{bold}}${content.trim()}{{/bold}}`;
      });

    // Format bullet points
    formattedText = formattedText.replace(/^\s*[•*-]\s*/gm, '• ');

    // Format numbered lists
    formattedText = formattedText.replace(/^(\d+)\.\s*/gm, '$1. ');

    // Format step headers
    formattedText = formattedText.replace(/^(Step \d+):\s*/gm, '$1: ');

    // Fix spacing and line breaks
    formattedText = formattedText
      .replace(/([.!?])\s*\n/g, '$1\n\n')
      .replace(/\n{3,}/g, '\n\n');

    return formattedText.trim();
  }

  async getPrimaryResponse(query, conversationHistory = []) {
    try {
      const startTime = Date.now();
      const response = await this.callPhi3Mini(query, conversationHistory);
      const timing = Date.now() - startTime;

      const result = {
        success: true,
        data: this.formatResponse(response.data.choices[0].message.content.trim()),
        mode: 'quick_answer',
        model: this.primaryModel,
        timing,
        tokens: {
          input: response.data.usage.prompt_tokens,
          output: response.data.usage.completion_tokens,
          total: response.data.usage.total_tokens
        }
      };

      conversationHistory.push({
        role: 'assistant',
        content: result.data
      });

      return result;
    } catch (error) {
      console.error('Primary model failed:', error);
      return this.getBackupResponse(query, conversationHistory);
    }
  }

  async getBackupResponse(query, conversationHistory = []) {
    try {
      const startTime = Date.now();
      const response = await this.callZephyr(query, conversationHistory);
      const timing = Date.now() - startTime;

      const result = {
        success: true,
        data: this.formatResponse(response.data.choices[0].message.content.trim()),
        mode: 'quick_answer',
        model: this.backupModel,
        timing,
        tokens: {
          input: response.data.usage.prompt_tokens,
          output: response.data.usage.completion_tokens,
          total: response.data.usage.total_tokens
        }
      };

      conversationHistory.push({
        role: 'assistant',
        content: result.data
      });

      return result;
    } catch (error) {
      console.error('Backup model failed:', error);
      throw new Error('Both primary and backup models failed');
    }
  }

  async callPhi3Mini(query, conversationHistory = []) {
    const messages = [
      {
        role: 'system',
        content: this.systemPrompt
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: query
      }
    ];

    return axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.primaryModel,
        messages,
        ...this.config
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEYS.PHI_3_MINI}`,
          'HTTP-Referer': API_CONFIG.REFERER,
          'X-Title': API_CONFIG.APP_TITLE,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  async callZephyr(query, conversationHistory = []) {
    const messages = [
      {
        role: 'system',
        content: this.systemPrompt
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: query
      }
    ];

    return axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.backupModel,
        messages,
        ...this.config
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEYS.ZEPHYR}`,
          'HTTP-Referer': API_CONFIG.REFERER,
          'X-Title': API_CONFIG.APP_TITLE,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

export const quickAnswerService = new QuickAnswerService(); 