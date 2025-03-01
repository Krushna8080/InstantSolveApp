import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  PREFERRED_MODE: '@InstantSolve:preferredMode',
  MODEL_PREFERENCES: '@InstantSolve:modelPreferences',
  CHAT_HISTORY: '@InstantSolve:chatHistory',
  USER_SETTINGS: '@InstantSolve:userSettings',
  TERMS_ACCEPTED: '@terms_accepted',
  THEME: '@theme',
};

const MAX_CHATS = 500; // Maximum number of chats to store

class StorageService {
  // Get preferred response mode
  async getPreferredMode() {
    try {
      const mode = await AsyncStorage.getItem(STORAGE_KEYS.PREFERRED_MODE);
      return mode;
    } catch (error) {
      console.error('Failed to get preferred mode:', error);
      return null;
    }
  }

  // Set preferred response mode
  async setPreferredMode(mode) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PREFERRED_MODE, mode);
      return true;
    } catch (error) {
      console.error('Failed to set preferred mode:', error);
      return false;
    }
  }

  // Get model preferences
  async getModelPreferences() {
    try {
      const preferences = await AsyncStorage.getItem(STORAGE_KEYS.MODEL_PREFERENCES);
      return preferences ? JSON.parse(preferences) : {};
    } catch (error) {
      console.error('Failed to get model preferences:', error);
      return {};
    }
  }

  // Set model preferences
  async setModelPreferences(preferences) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MODEL_PREFERENCES, JSON.stringify(preferences));
      return true;
    } catch (error) {
      console.error('Failed to set model preferences:', error);
      return false;
    }
  }

  // Update specific model preference
  async updateModelPreference(mode, settings) {
    try {
      const preferences = await this.getModelPreferences();
      preferences[mode] = { ...preferences[mode], ...settings };
      await this.setModelPreferences(preferences);
      return true;
    } catch (error) {
      console.error('Failed to update model preference:', error);
      return false;
    }
  }

  // Get chat history
  async getChatHistory() {
    try {
      const history = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to get chat history:', error);
      return [];
    }
  }

  // Save chat history with limit enforcement
  async saveChatHistory(history) {
    try {
      // If history exceeds limit, remove oldest chats
      if (history.length > MAX_CHATS) {
        history = history.slice(0, MAX_CHATS);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(history));
      return true;
    } catch (error) {
      console.error('Failed to save chat history:', error);
      return false;
    }
  }

  // Add a new chat with limit enforcement
  async addChat(newChat) {
    try {
      const history = await this.getChatHistory();
      const updatedHistory = [newChat, ...history];
      
      // If adding this chat would exceed the limit, remove the oldest one
      if (updatedHistory.length > MAX_CHATS) {
        updatedHistory.pop(); // Remove the last (oldest) chat
      }
      
      await this.saveChatHistory(updatedHistory);
      return true;
    } catch (error) {
      console.error('Failed to add chat:', error);
      return false;
    }
  }

  // Get user settings
  async getUserSettings() {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      return settings ? JSON.parse(settings) : {
        theme: 'light',
        fontSize: 'medium',
        enableVoice: true,
        enableAutoMode: true
      };
    } catch (error) {
      console.error('Failed to get user settings:', error);
      return {
        theme: 'light',
        fontSize: 'medium',
        enableVoice: true,
        enableAutoMode: true
      };
    }
  }

  // Update user settings
  async updateUserSettings(settings) {
    try {
      const currentSettings = await this.getUserSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(updatedSettings));
      return true;
    } catch (error) {
      console.error('Failed to update user settings:', error);
      return false;
    }
  }

  // Theme storage
  async getTheme() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    } catch (error) {
      console.error('Error getting theme:', error);
      return null;
    }
  }

  async setTheme(theme) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  }

  // Terms acceptance storage
  async hasAcceptedTerms() {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.TERMS_ACCEPTED);
      return value === 'true';
    } catch (error) {
      console.error('Error checking terms acceptance:', error);
      return false;
    }
  }

  async setTermsAccepted(accepted) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TERMS_ACCEPTED, accepted.toString());
      return true;
    } catch (error) {
      console.error('Error setting terms acceptance:', error);
      return false;
    }
  }

  // Clear all stored data
  async clearStorage() {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }
}

export const storageService = new StorageService(); 