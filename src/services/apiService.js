import axios from 'axios';
import { modelSelector } from './api/modelSelector';
import { MODES, API_KEYS, MODELS } from './api/constants';
import { imageAnalysisService } from './api/imageAnalysisService';

// API Configuration for OpenRouter
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Gemini API key and model (Primary)
const GEMINI_API_KEY = API_KEYS.GEMINI;
const GEMINI_MODEL = MODELS.GEMINI;

// DeepSeek R1 API key and model (Fallback)
const DEEPSEEK_API_KEY = API_KEYS.LLAMA_3;
const DEEPSEEK_MODEL = MODELS.LLAMA_3;

// OpenRouter reference details
const REFERER = 'instantsolve-app.com';
const APP_TITLE = 'InstantSolve';

// Main function to get an answer
export const getAnswer = async (query, imageUrl = null, previousMessages = [], options = {}) => {
  try {
    // If there's an image, use the image analysis mode
    if (imageUrl) {
      return await imageAnalysisService.analyzeImage(query, imageUrl, previousMessages);
    }

    // Get response using model selector with explicit mode
    const response = await modelSelector.getResponse(query, {
      previousMessages,
      mode: options.mode
    });

    if (response) {
      return {
        success: true,
        data: response.data,
        mode: response.mode,
        model: response.model,
        detectedFeatures: response.detectedMode.features
      };
    } else {
      throw new Error('No response received from models');
    }
  } catch (error) {
    console.error('Error getting answer:', error);
    return {
      success: false,
      error: 'Sorry, we couldn\'t get an answer at this time. Please try again.',
      mode: options.mode || MODES.QUICK_ANSWER,
      model: null
    };
  }
};

// Function to call Gemini API via OpenRouter (Primary API, supports images)
export const callGeminiApi = async (query, imageUrl = null, previousMessages = []) => {
  try {
    // Format previous messages to include role
    const formattedPreviousMessages = previousMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.role === 'user' ? msg.query : msg.answer
    }));

    // Prepare message content based on whether an image is provided
    let currentMessage;
    
    if (imageUrl) {
      currentMessage = {
        role: 'user',
        content: [
          {
            type: "text",
            text: query
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          }
        ]
      };
    } else {
      currentMessage = {
        role: 'user',
        content: query
      };
    }

    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: GEMINI_MODEL,
        messages: [...formattedPreviousMessages, currentMessage],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
        frequency_penalty: 0.5
      },
      {
        headers: {
          'Authorization': `Bearer ${GEMINI_API_KEY}`,
          'HTTP-Referer': REFERER,
          'X-Title': APP_TITLE,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content.trim();
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error('Gemini API call failed:', error.response?.data || error.message);
    throw error;
  }
};

// Function to call DeepSeek API via OpenRouter (Fallback API, text-only)
export const callDeepSeekApi = async (query, previousMessages = []) => {
  try {
    // Format previous messages to include role
    const formattedPreviousMessages = previousMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.role === 'user' ? msg.query : msg.answer
    }));

    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: DEEPSEEK_MODEL,
        messages: [
          ...formattedPreviousMessages,
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
        frequency_penalty: 0.5
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'HTTP-Referer': REFERER,
          'X-Title': APP_TITLE,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content.trim();
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error('DeepSeek API call failed:', error.response?.data || error.message);
    throw error;
  }
};