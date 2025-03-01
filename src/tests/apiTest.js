const axios = require('axios');

// API Configuration
const API_KEY = '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'; // Using LLAMA-3 key
const MODEL = 'meta-llama/llama-3.1-8b-instruct:free';  // Using LLAMA-3 model
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Headers configuration with all recommended fields
const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://instantsolve-app.com',
  'X-Title': 'InstantSolve',
  'OR-SITE-URL': 'https://instantsolve-app.com'
};

async function checkApiStatus() {
  try {
    // First, try to get API status
    console.log('Checking OpenRouter API status...');
    const statusResponse = await axios.get('https://openrouter.ai/api/v1/status');
    console.log('API Status:', statusResponse.data);
  } catch (error) {
    console.error('Failed to check API status:', error.message);
  }
}

// Test function
async function testOpenRouterAPI() {
  try {
    // First check API status
    await checkApiStatus();

    console.log('\nTesting OpenRouter API with LLAMA-3 model...');
    console.log('Model:', MODEL);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    
    const response = await axios.post(
      API_URL,
      {
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: 'Hello, is this working? Simple test message.'
          }
        ]
      },
      { headers }
    );

    console.log('\nAPI Response:');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('\nError occurred:');
    console.error('Status:', error.response?.status);
    console.error('Error message:', error.message);
    
    if (error.response?.status === 401) {
      console.error('\nPossible reasons for 401 error:');
      console.error('1. API key has expired');
      console.error('2. Daily quota limit reached for free tier');
      console.error('3. Rate limiting in effect');
      
      console.error('\nSuggestions:');
      console.error('- Wait 24 hours for quota reset');
      console.error('- Check OpenRouter dashboard: https://openrouter.ai/dashboard');
      console.error('- Consider upgrading to a paid tier if needed');
    }
    
    if (error.response?.data) {
      console.error('\nFull error response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testOpenRouterAPI(); 