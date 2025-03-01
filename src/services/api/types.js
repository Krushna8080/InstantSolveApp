// Response type definition
export const ResponseType = {
  success: Boolean,
  data: String,
  error: String,
  mode: String,
  model: String,
  timing: Number,
  tokens: {
    input: Number,
    output: Number,
    total: Number
  }
};

// Query type definition
export const QueryType = {
  text: String,
  imageUrl: String,
  mode: String,
  previousMessages: Array,
  options: {
    temperature: Number,
    max_tokens: Number,
    top_p: Number,
    frequency_penalty: Number
  }
};

// Message type for chat history
export const MessageType = {
  role: String,
  content: String,
  timestamp: Date,
  mode: String,
  model: String
};

// API Error type
export const APIErrorType = {
  code: String,
  message: String,
  details: Object
};

// Model Response type
export const ModelResponseType = {
  id: String,
  choices: Array,
  model: String,
  usage: {
    prompt_tokens: Number,
    completion_tokens: Number,
    total_tokens: Number
  }
};

// Mode Detection Result type
export const ModeDetectionResultType = {
  mode: String,
  confidence: Number,
  features: Array,
  alternativeModes: Array
}; 