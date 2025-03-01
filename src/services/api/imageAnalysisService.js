import axios from 'axios';
import { API_KEYS, MODELS, API_CONFIG, MODEL_CONFIG } from './constants';
import { ResponseType, QueryType } from './types';

class ImageAnalysisService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.primaryModel = MODELS.LLAMA_VISION;
    this.backupModel = MODELS.GEMINI;
    this.config = MODEL_CONFIG.IMAGE;
    this.systemPrompt = `You are an advanced visual analysis expert. Your task is to:

For Image Analysis:
1. Provide detailed visual analysis of images
2. Identify and describe key elements:
   • Main subjects and characteristics
   • Colors, patterns, and composition
   • Text or symbols present
   • Spatial relationships
3. Detect and analyze:
   • Emotions and expressions
   • Actions and interactions
   • Style and artistic elements
   • Technical aspects

For Visual Questions (without images):
1. Provide visual descriptions and explanations
2. Describe visual concepts and relationships
3. Explain visual principles and techniques
4. Answer questions about visual elements
5. Provide examples and analogies
6. Explain design and aesthetic concepts

General Guidelines:
• Use clear, descriptive language
• Maintain professional tone
• Provide systematic analysis
• Include relevant examples
• Consider multiple perspectives`;
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

    // Format section headers (commonly used in image analysis)
    formattedText = formattedText.replace(/^(Objects|People|Text|Colors|Composition|Analysis|Summary):\s*/gm, '{{bold}}$1:{{/bold}} ');

    // Format bullet points
    formattedText = formattedText.replace(/^\s*[•*-]\s*/gm, '• ');

    // Format numbered lists
    formattedText = formattedText.replace(/^(\d+)\.\s*/gm, '$1. ');

    // Fix spacing and line breaks
    formattedText = formattedText
      .replace(/([.!?])\s*\n/g, '$1\n\n')
      .replace(/\n{3,}/g, '\n\n');

    return formattedText.trim();
  }

  async analyzeImage(query, imageUrl = null, conversationHistory = []) {
    try {
      if (imageUrl) {
        // Handle image analysis with actual image
        this.validateImageUrl(imageUrl);
        const response = await this.callLlamaVision(query, imageUrl, conversationHistory);
        return this.processResponse(response, 'primary', imageUrl);
      } else {
        // Handle text-only visual queries
        const response = await this.callGemini(query, null, conversationHistory);
        return this.processResponse(response, 'backup', null);
      }
    } catch (error) {
      console.error('Primary analysis failed:', error);
      return this.getBackupAnalysis(query, imageUrl, conversationHistory);
    }
  }

  processResponse(response, modelType, imageUrl = null) {
    if (!response?.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response structure');
    }

    return {
      success: true,
      data: this.formatResponse(response.data.choices[0].message.content.trim()),
      mode: 'image',
      model: modelType === 'primary' ? this.primaryModel : this.backupModel,
      timing: Date.now(),
      tokens: {
        input: response.data.usage?.prompt_tokens || 0,
        output: response.data.usage?.completion_tokens || 0,
        total: response.data.usage?.total_tokens || 0
      }
    };
  }

  async getBackupAnalysis(query, imageUrl, conversationHistory = []) {
    try {
      const startTime = Date.now();
      const response = await this.callGemini(query, imageUrl, conversationHistory);
      const timing = Date.now() - startTime;

      const result = {
        success: true,
        data: this.formatResponse(response.data.choices[0].message.content.trim()),
        mode: 'image',
        model: this.backupModel,
        timing,
        tokens: {
          input: response.data.usage.prompt_tokens,
          output: response.data.usage.completion_tokens,
          total: response.data.usage.total_tokens
        }
      };

      // Add this response to conversation history
      conversationHistory.push({
        role: 'assistant',
        content: result.data,
        imageUrl: imageUrl // Store image URL for context
      });

      return result;
    } catch (error) {
      console.error('Backup image analysis failed:', error);
      throw new Error('Both primary and backup image analysis failed');
    }
  }

  async callLlamaVision(query, imageUrl, conversationHistory = []) {
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
        content: [
          {
            type: "text",
            text: query
          },
          {
            type: "image_url",
            image_url: { url: imageUrl }
          }
        ]
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
          'Authorization': `Bearer ${API_KEYS.LLAMA_VISION}`,
          'HTTP-Referer': API_CONFIG.REFERER,
          'X-Title': API_CONFIG.APP_TITLE,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  async callGemini(query, imageUrl = null, conversationHistory = []) {
    const messages = [
      {
        role: 'system',
        content: this.systemPrompt
      },
      ...conversationHistory,
      {
        role: 'user',
        content: imageUrl ? [
          { type: 'text', text: query },
          { type: 'image_url', image_url: { url: imageUrl } }
        ] : query
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
          'Authorization': `Bearer ${API_KEYS.GEMINI}`,
          'HTTP-Referer': API_CONFIG.REFERER,
          'X-Title': API_CONFIG.APP_TITLE,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  // Helper method to validate image URL
  validateImageUrl(url) {
    const validImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const extension = url.split('.').pop().toLowerCase();
    return validImageTypes.includes(extension);
  }

  isVisualQuery(query) {
    const visualPatterns = [
      /\b(?:look|see|show|display|appear|visual|image|picture|photo|diagram|graph|chart)\b/i,
      /\b(?:color|shape|pattern|design|layout|style|arrangement|composition)\b/i,
      /\b(?:describe|analyze|examine|observe|inspect|identify)\b/i,
      /\b(?:aesthetic|artistic|beautiful|attractive|appealing)\b/i,
      /\b(?:logo|icon|symbol|illustration|artwork|drawing)\b/i,
      /\b(?:how does it look|what does it look like|appearance|visually)\b/i
    ];

    return visualPatterns.some(pattern => pattern.test(query));
  }

  // Add getPrimaryResponse method
  async getPrimaryResponse(query, previousMessages = []) {
    return this.analyzeImage(query, null, previousMessages);
  }
}

export const imageAnalysisService = new ImageAnalysisService(); 