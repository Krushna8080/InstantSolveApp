import axios from 'axios';
import { API_KEYS, MODELS, API_CONFIG, MODEL_CONFIG } from './constants';
import { ResponseType, QueryType } from './types';

class CreativeResponseService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.primaryModel = MODELS.MYTHOMAX;
    this.backupModel = MODELS.LLAMA_3;
    this.config = MODEL_CONFIG.CREATIVE;
    this.systemPrompt = `You are an expert creative content generator. Your task is to:
1. Generate imaginative and original content:
   • Stories and narratives
   • Poetry and prose
   • Creative descriptions
   • Unique concepts
   • Innovative solutions
2. Incorporate rich elements:
   • Vivid imagery and sensory details
   • Engaging characters and dialogue
   • Emotional depth and resonance
   • Varied vocabulary and phrasing
   • Metaphors and symbolism
3. Maintain quality standards:
   • Coherent structure and flow
   • Proper grammar and style
   • Consistent tone and voice
   • Appropriate length and pacing
4. Adapt to specific requests:
   • Follow given prompts or themes
   • Match requested formats
   • Incorporate user elements
   • Respect genre conventions
5. Add creative flourishes:
   • Unexpected twists
   • Clever wordplay
   • Unique perspectives
   • Memorable moments

Format content with:
• Clear structure
• Visual appeal
• Appropriate spacing
• Stylistic consistency
• Professional presentation`;
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

    // Format creative section headers
    formattedText = formattedText.replace(/^(Story|Poem|Idea|Concept|Theme|Metaphor|Perspective):\s*/gm, '{{bold}}$1:{{/bold}} ');

    // Format bullet points
    formattedText = formattedText.replace(/^\s*[•*-]\s*/gm, '• ');

    // Format numbered lists
    formattedText = formattedText.replace(/^(\d+)\.\s*/gm, '$1. ');

    // Format quoted text (common in creative responses)
    formattedText = formattedText.replace(/^>\s*(.+)$/gm, '> $1');

    // Fix spacing and line breaks, preserving poetic line breaks
    formattedText = formattedText
      .replace(/([.!?])\s*\n(?!\n)/g, '$1\n') // Keep single line breaks
      .replace(/\n{3,}/g, '\n\n'); // Normalize multiple line breaks

    return formattedText.trim();
  }

  async getPrimaryResponse(query, conversationHistory = []) {
    try {
      const startTime = Date.now();
      const response = await this.callMythomax(query, conversationHistory);
      const timing = Date.now() - startTime;

      const result = {
        success: true,
        data: this.formatResponse(response.data.choices[0].message.content.trim()),
        mode: 'creative',
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
      const response = await this.callLlama3(query, conversationHistory);
      const timing = Date.now() - startTime;

      const result = {
        success: true,
        data: this.formatResponse(response.data.choices[0].message.content.trim()),
        mode: 'creative',
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

  async callMythomax(query, conversationHistory = []) {
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
          'Authorization': `Bearer ${API_KEYS.MYTHOMAX}`,
          'HTTP-Referer': API_CONFIG.REFERER,
          'X-Title': API_CONFIG.APP_TITLE,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  async callLlama3(query, conversationHistory = []) {
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
          'Authorization': `Bearer ${API_KEYS.LLAMA_3}`,
          'HTTP-Referer': API_CONFIG.REFERER,
          'X-Title': API_CONFIG.APP_TITLE,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  // Helper method to check if query needs creative response
  isCreativeQuery(query) {
    const creativePatterns = [
      /create|generate|imagine|write/i,
      /story|poem|song|script/i,
      /creative|innovative|original/i,
      /metaphor|analogy|visualization/i
    ];

    return creativePatterns.some(pattern => pattern.test(query));
  }
}

export const creativeResponseService = new CreativeResponseService(); 