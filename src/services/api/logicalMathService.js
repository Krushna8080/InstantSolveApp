import axios from 'axios';
import { API_KEYS, MODELS, API_CONFIG, MODEL_CONFIG } from './constants';

class LogicalMathService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.primaryModel = MODELS.PHI_3_MEDIUM;
    this.backupModel = MODELS.GEMINI;
    this.config = {
      ...MODEL_CONFIG.LOGICAL_MATH,
      temperature: 0.3,  // Slightly increased for better word problem handling
      top_p: 0.95,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
    };
  }

  async getPrimaryResponse(query, conversationHistory = []) {
    try {
      const startTime = Date.now();
      const response = await this.callPhi3Medium(query, conversationHistory);
      const timing = Date.now() - startTime;

      if (!response?.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response structure from API');
      }

      const result = {
        success: true,
        data: this.formatMathResponse(response.data.choices[0].message.content.trim()),
        mode: 'logical_math',
        model: this.primaryModel,
        timing,
        tokens: {
          input: response.data.usage?.prompt_tokens || 0,
          output: response.data.usage?.completion_tokens || 0,
          total: response.data.usage?.total_tokens || 0
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
      const response = await this.callGemini(query, conversationHistory);
      const timing = Date.now() - startTime;

      const result = {
        success: true,
        data: this.formatMathResponse(response.data.choices[0].message.content.trim()),
        mode: 'logical_math',
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

  async callGemini(query, conversationHistory = []) {
    const systemPrompt = `You are a mathematical and logical reasoning expert. Your task is to:
1. Solve mathematical problems step by step
2. Show all work clearly with proper formatting
3. Use mathematical notation when appropriate
4. Explain your reasoning at each step
5. Verify the final answer
6. Keep responses clear and concise

If the query is not mathematical, provide logical reasoning and structured analysis.`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: this.containsMathematical(query) ? 
          `Solve this mathematical problem step by step: ${query}` :
          `Analyze this logical problem step by step: ${query}`
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
          'Authorization': `Bearer ${API_KEYS.GEMINI}`,
          'HTTP-Referer': API_CONFIG.REFERER,
          'X-Title': API_CONFIG.APP_TITLE,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  async callPhi3Medium(query, conversationHistory = []) {
    const systemPrompt = `You are a mathematical and logical reasoning expert. Your task is to:
1. Analyze and solve any type of mathematical problems, including:
   - Word problems and story-based math questions
   - Numerical calculations and equations
   - Algebraic expressions and formulas
   - Geometry and spatial problems
   - Logic puzzles and mathematical reasoning
2. Show all work clearly with proper formatting
3. Use mathematical notation when appropriate
4. Explain your reasoning at each step
5. Verify the final answer
6. Keep responses clear and concise

For word problems:
- First identify the key mathematical concepts
- Convert the words into mathematical expressions
- Solve step by step
- Explain the solution in context of the original problem`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: `Solve this mathematical problem step by step: ${query}`
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
          'Authorization': `Bearer ${API_KEYS.PHI_3_MEDIUM}`,
          'HTTP-Referer': API_CONFIG.REFERER,
          'X-Title': API_CONFIG.APP_TITLE,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  containsMathematical(query) {
    const mathPatterns = [
      /[\d+\-*/^()=]/,  // Basic math operators
      /\b(?:sin|cos|tan|log|sqrt)\b/i,  // Math functions
      /\b\d*\.?\d+\b/,  // Numbers
      /[∑∏∫∂√π∞]/,  // Mathematical symbols
      /\b(?:solve|calculate|evaluate|simplify|factor|find|how many|what is|sum|difference|product|quotient)\b/i,  // Math keywords
      /\b(?:equation|expression|formula|function|problem|question)\b/i,  // Math terms
      /\b(?:algebra|calculus|geometry|trigonometry|arithmetic|math|plus|minus|times|divided|percent|ratio)\b/i,  // Math subjects and terms
      /\b(?:total|more than|less than|equal|greater|fewer|twice|triple|half)\b/i,  // Comparative terms
      /\b(?:square|cube|root|power|exponent)\b/i,  // Power and root terms
      /\b(?:area|perimeter|volume|distance|speed|time)\b/i,  // Measurement terms
    ];

    return mathPatterns.some(pattern => pattern.test(query));
  }

  formatMathResponse(response) {
    // Format the response for better readability
    let formatted = response
      .split('\n')
      .map(line => {
        // Add proper spacing around mathematical operators
        line = line.replace(/([+\-*/=<>≤≥])/g, ' $1 ');
        
        // Format step numbers
        if (line.match(/^(Step \d+:|Given:|Solution:|Let's solve this step by step:)/i)) {
          line = `\n${line}`;
        }
        
        // Format final answer
        if (line.match(/^(Answer:|Result:|Therefore:|Thus:|The solution is:|In conclusion:)/i)) {
          line = `\n${line}`;
        }

        return line;
      })
      .join('\n');

    // Add a separator before the final answer if not present
    if (!formatted.includes('\nAnswer:') && !formatted.includes('\nResult:') && 
        !formatted.includes('\nTherefore:') && !formatted.includes('\nThus:') && 
        !formatted.includes('\nThe solution is:') && !formatted.includes('\nIn conclusion:')) {
      formatted += '\n\nAnswer: ' + formatted.split('\n').pop();
    }

    return formatted;
  }
}

export const logicalMathService = new LogicalMathService(); 