import { MODES, MODE_KEYWORDS } from './constants';
import { quickAnswerService } from './quickAnswerService';
import { logicalMathService } from './logicalMathService';
import { detailedExplanationService } from './detailedExplanationService';
import { imageAnalysisService } from './imageAnalysisService';
import { creativeResponseService } from './creativeResponseService';
import { ModeDetectionResultType } from './types';

class ModelSelector {
  constructor() {
    this.services = {
      [MODES.QUICK_ANSWER]: quickAnswerService,
      [MODES.LOGICAL_MATH]: logicalMathService,
      [MODES.DETAILED]: detailedExplanationService,
      [MODES.IMAGE]: imageAnalysisService,
      [MODES.CREATIVE]: creativeResponseService
    };
  }

  detectQueryType(query) {
    // Initialize confidence scores for each mode
    const scores = {
      [MODES.QUICK_ANSWER]: 0,
      [MODES.LOGICAL_MATH]: 0,
      [MODES.DETAILED]: 0,
      [MODES.CREATIVE]: 0
    };

    // Convert query to lowercase for matching
    const queryLower = query.toLowerCase();

    // Check for mode-specific keywords
    Object.entries(MODE_KEYWORDS).forEach(([mode, keywords]) => {
      keywords.forEach(keyword => {
        if (queryLower.includes(keyword.toLowerCase())) {
          scores[mode] += 1;
        }
      });
    });

    // Check for mathematical expressions
    if (this.containsMathematical(queryLower)) {
      scores[MODES.LOGICAL_MATH] += 2;
    }

    // Check query length for mode hints
    const wordCount = queryLower.split(' ').length;
    if (wordCount <= 6) {
      scores[MODES.QUICK_ANSWER] += 1;
    } else if (wordCount >= 15) {
      scores[MODES.DETAILED] += 1;
    }

    // Find mode with highest score
    let selectedMode = MODES.QUICK_ANSWER; // Default mode
    let highestScore = scores[MODES.QUICK_ANSWER];

    Object.entries(scores).forEach(([mode, score]) => {
      if (score > highestScore) {
        highestScore = score;
        selectedMode = mode;
      }
    });

    // Calculate confidence
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = totalScore > 0 ? highestScore / totalScore : 0.5;

    // Get alternative modes (modes with non-zero scores)
    const alternativeModes = Object.entries(scores)
      .filter(([mode, score]) => score > 0 && mode !== selectedMode)
      .map(([mode]) => mode);

    return {
      mode: selectedMode,
      confidence,
      features: this.extractFeatures(queryLower),
      alternativeModes
    };
  }

  containsMathematical(query) {
    const mathPatterns = [
      /[\d+\-*/^()=]/,  // Basic math operators
      /\b(?:sin|cos|tan|log|sqrt)\b/i,  // Math functions
      /\b\d*\.?\d+\b/,  // Numbers
      /[∑∏∫∂√π∞]/  // Mathematical symbols
    ];

    return mathPatterns.some(pattern => pattern.test(query));
  }

  extractFeatures(query) {
    const features = [];

    // Length-based features
    const wordCount = query.split(' ').length;
    features.push(`Word count: ${wordCount}`);

    // Question type features
    if (query.startsWith('what') || query.startsWith('who') || 
        query.startsWith('when') || query.startsWith('where') ||
        query.startsWith('why') || query.startsWith('how')) {
      features.push('Question word detected');
    }

    // Mathematical features
    if (this.containsMathematical(query)) {
      features.push('Mathematical expression detected');
    }

    // Command features
    if (query.startsWith('calculate') || query.startsWith('solve') ||
        query.startsWith('explain') || query.startsWith('describe')) {
      features.push('Command detected');
    }

    return features;
  }

  async getResponse(query, options = {}) {
    try {
      // If mode is explicitly set, use that mode's service
      if (options.mode) {
        const service = this.services[options.mode];
        if (service) {
          return {
            ...(await service.getPrimaryResponse(query, options.previousMessages)),
            detectedMode: { mode: options.mode, confidence: 1, features: [] }
          };
        }
      }

      // Otherwise detect query type
      const queryType = this.detectQueryType(query);
      
      // Get appropriate service
      const service = this.services[queryType.mode] || this.services[MODES.QUICK_ANSWER];
      
      // Get response from service
      const response = await service.getPrimaryResponse(query, options.previousMessages);
      
      return {
        ...response,
        detectedMode: queryType
      };
    } catch (error) {
      console.error('Model selector error:', error);
      // Fallback to quick answer service if something goes wrong
      return quickAnswerService.getPrimaryResponse(query, options.previousMessages);
    }
  }
}

export const modelSelector = new ModelSelector(); 