import axios from 'axios';
import { API_KEYS, MODELS, API_CONFIG, MODEL_CONFIG } from './constants';
import { ResponseType, QueryType } from './types';

class DetailedExplanationService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.primaryModel = MODELS.LLAMA_3;
    this.backupModel = MODELS.PHI_3_MEDIUM;
    this.config = MODEL_CONFIG.DETAILED;
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
      })
      // Remove any nested or duplicate bold tags
      .replace(/\{\{bold\}\}\s*\{\{bold\}\}/g, '{{bold}}')
      .replace(/\{\{\/bold\}\}\s*\{\{\/bold\}\}/g, '{{/bold}}')
      // Fix spacing around bold tags
      .replace(/\s*\{\{bold\}\}\s*/g, '{{bold}}')
      .replace(/\s*\{\{\/bold\}\}\s*/g, '{{/bold}}')
      // Fix line breaks inside bold tags
      .replace(/\{\{bold\}\}([\s\S]*?)\{\{\/bold\}\}/g, (match, content) => {
        return `{{bold}}${content.trim()}{{/bold}}`;
      });

    // Format section headers
    formattedText = formattedText.replace(/^(#+)\s*([^#\n]+)/gm, (match, hashes, content) => {
      return `### ${content.trim()} ###`;
    });

    // Format bullet points
    formattedText = formattedText.replace(/^\s*[•*-]\s*/gm, '• ');

    // Format numbered lists
    formattedText = formattedText.replace(/^(\d+)\.\s*/gm, '$1. ');

    // Format step headers
    formattedText = formattedText.replace(/^(Step \d+):\s*/gm, '$1: ');

    // Fix spacing after bullet points and numbers
    formattedText = formattedText
      .replace(/(^[•\d]\.\s+)\{\{bold\}\}/gm, '$1{{bold}}')
      // Ensure proper spacing between items
      .replace(/([.!?])\s*\n/g, '$1\n\n')
      // Remove extra newlines
      .replace(/\n{3,}/g, '\n\n')
      // Fix spacing around bold tags at line start
      .replace(/^(\s*)\{\{bold\}\}/gm, '$1{{bold}}')
      // Ensure space after bold tags
      .replace(/\{\{\/bold\}\}(?!\s|$)/g, '{{/bold}} ');

    return formattedText.trim();
  }

  async getPrimaryResponse(query, conversationHistory = []) {
    try {
      const startTime = Date.now();
      const response = await this.callLlama3(query, conversationHistory);
      const timing = Date.now() - startTime;

      const formattedContent = this.formatResponse(response.data.choices[0].message.content.trim());

      const result = {
        success: true,
        data: formattedContent,
        mode: 'detailed',
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
        content: formattedContent
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
      const response = await this.callPhi3Medium(query, conversationHistory);
      const timing = Date.now() - startTime;

      const formattedContent = this.formatResponse(response.data.choices[0].message.content.trim());

      const result = {
        success: true,
        data: formattedContent,
        mode: 'detailed',
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
        content: formattedContent
      });

      return result;
    } catch (error) {
      console.error('Backup model failed:', error);
      throw new Error('Both primary and backup models failed');
    }
  }

  async callLlama3(query, conversationHistory = []) {
    // Format conversation history for API
    const messages = [
      {
        role: 'system',
        content: 'You are a detailed explanation expert focused on providing accurate, factual information. Never fabricate or make up information. If you are not certain about something, acknowledge the uncertainty or lack of information. For topics like historical figures, mythology, or real people, only provide verified, accurate information from reliable sources. If asked about something that does not exist or you are not sure about, clearly state that rather than making up details.'
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
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.max_tokens || 1000,
        top_p: this.config.top_p || 0.95,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEYS.LLAMA_3}`,
          'HTTP-Referer': API_CONFIG.REFERER,
          'X-Title': API_CONFIG.APP_TITLE,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  async callPhi3Medium(query, conversationHistory = []) {
    // Format conversation history for API
    const messages = [
      {
        role: 'system',
        content: 'You are a detailed explanation expert focused on providing accurate, factual information. Never fabricate or make up information. If you are not certain about something, acknowledge the uncertainty or lack of information. For topics like historical figures, mythology, or real people, only provide verified, accurate information from reliable sources. If asked about something that does not exist or you are not sure about, clearly state that rather than making up details.'
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
          'Authorization': `Bearer ${API_KEYS.PHI_3_MEDIUM}`,
          'HTTP-Referer': API_CONFIG.REFERER,
          'X-Title': API_CONFIG.APP_TITLE,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  // Helper method to format detailed responses
  formatDetailedResponse(response) {
    // Add section headers and improve formatting
    const sections = response.split('\n\n');
    return sections.map(section => {
      if (section.includes(':')) {
        const [title, ...content] = section.split(':');
        return `### ${title.trim()} ###\n${content.join(':').trim()}`;
      }
      return section;
    }).join('\n\n');
  }

  // Helper method to check if query needs detailed response
  needsDetailedResponse(query) {
    const detailedPatterns = [
      /explain|describe|elaborate|analyze/i,
      /how does|why does|what causes/i,
      /compare|contrast|difference/i,
      /in detail|thoroughly|comprehensively/i
    ];

    return detailedPatterns.some(pattern => pattern.test(query));
  }
}

export const detailedExplanationService = new DetailedExplanationService(); 