import {
  PHI_3_MINI_KEY,
  PHI_3_MEDIUM_KEY,
  MYTHOMAX_KEY,
  GEMINI_KEY,
  TOPPY_M_KEY,
  ZEPHYR_KEY,
  LLAMA_3_KEY,
  LLAMA_VISION_KEY,
  OPENCHAT_KEY,
  API_BASE_URL,
  APP_REFERER,
  APP_TITLE
} from '@env';

// Load environment variables
const getEnvVar = (key) => {
  if (process.env[key] === undefined) {
    console.warn(`Warning: Environment variable ${key} is not set`);
    return '';
  }
  return process.env[key];
};

// API Keys for different models with fallbacks
export const API_KEYS = {
  PHI_3_MINI: PHI_3_MINI_KEY || '',
  PHI_3_MEDIUM: PHI_3_MEDIUM_KEY || '',
  MYTHOMAX: MYTHOMAX_KEY || '',
  GEMINI: GEMINI_KEY || '',
  TOPPY_M: TOPPY_M_KEY || '',
  ZEPHYR: ZEPHYR_KEY || '',
  LLAMA_3: LLAMA_3_KEY || '',
  LLAMA_VISION: LLAMA_VISION_KEY || '',
  OPENCHAT: OPENCHAT_KEY || ''
};

// Model identifiers
export const MODELS = {
  PHI_3_MINI: 'microsoft/phi-3-mini-128k-instruct:free',
  PHI_3_MEDIUM: 'microsoft/phi-3-medium-128k-instruct:free',
  MYTHOMAX: 'gryphe/mythomax-l2-13b:free',
  GEMINI: 'google/gemini-2.0-pro-exp-02-05:free',
  TOPPY_M: 'undi95/toppy-m-7b',
  ZEPHYR: 'huggingfaceh4/zephyr-7b-beta:free',
  LLAMA_3: 'meta-llama/llama-3.1-8b-instruct:free',
  LLAMA_VISION: 'meta-llama/llama-3.2-11b-vision-instruct:free',
  OPENCHAT: 'openchat/openchat-3.5-7b:free'
};

// Response modes
export const MODES = {
  QUICK_ANSWER: 'quick_answer',
  LOGICAL_MATH: 'logical_math',
  DETAILED: 'detailed',
  IMAGE: 'image',
  CREATIVE: 'creative'
};

// Mode descriptions for better user understanding
export const MODE_DESCRIPTIONS = {
  [MODES.QUICK_ANSWER]: 'Get quick, concise answers to simple questions',
  [MODES.LOGICAL_MATH]: 'Solve mathematical problems and logical queries',
  [MODES.DETAILED]: 'Get comprehensive explanations and detailed answers',
  [MODES.IMAGE]: 'Analyze images and get visual insights',
  [MODES.CREATIVE]: 'Generate creative content and ideas'
};

// OpenRouter API configuration
export const API_CONFIG = {
  BASE_URL: API_BASE_URL || 'https://openrouter.ai/api/v1',
  REFERER: APP_REFERER || 'https://instantsolve-app.com',
  APP_TITLE: APP_TITLE || 'InstantSolve',
  HEADERS: {
    'Content-Type': 'application/json'
  }
};

// Model specific configurations
export const MODEL_CONFIG = {
  QUICK_ANSWER: {
    max_tokens: 250,
    temperature: 0.7,
    top_p: 0.9,
    frequency_penalty: 0.0
  },
  LOGICAL_MATH: {
    max_tokens: 500,
    temperature: 0.3,
    top_p: 0.95,
    frequency_penalty: 0.1
  },
  DETAILED: {
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 0.95,
    frequency_penalty: 0.1,
    presence_penalty: 0.1
  },
  IMAGE: {
    max_tokens: 500,
    temperature: 0.7,
    top_p: 0.9,
    frequency_penalty: 0.0
  },
  CREATIVE: {
    max_tokens: 750,
    temperature: 0.9,
    top_p: 0.95,
    frequency_penalty: 0.7
  }
};

// Keywords for mode detection
export const MODE_KEYWORDS = {
  QUICK_ANSWER: [
    'what is',
    'who is',
    'when',
    'where',
    'define',
    'brief',
    'quick',
    'short'
  ],
  LOGICAL_MATH: [
    'calculate',
    'solve',
    'compute',
    'math',
    'equation',
    'proof',
    'logic',
    'algorithm'
  ],
  DETAILED: [
    'explain',
    'describe',
    'elaborate',
    'analyze',
    'compare',
    'contrast',
    'detail'
  ],
  CREATIVE: [
    'create',
    'write',
    'imagine',
    'story',
    'creative',
    'design',
    'generate'
  ]
};