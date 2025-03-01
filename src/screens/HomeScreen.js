import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, Text, Image, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { storageService } from '../services/storageService';
import Header from '../components/Header';
import ChatSidebar from '../components/ChatSidebar';
import MainContent from '../components/MainContent';
import { getAnswer } from '../services/apiService';
import { MODES } from '../services/api/constants';
import TermsAndConditions from './TermsAndConditions';
import { MaterialIcons } from '@expo/vector-icons';

const HomeScreen = ({ onShowTerms }) => {
  const { colors, theme, toggleTheme } = useTheme();
  const scrollViewRef = useRef();
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentMode, setCurrentMode] = useState(MODES.QUICK_ANSWER);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState('');
  const [abortController, setAbortController] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const savedHistory = await storageService.getChatHistory();
      if (savedHistory.length > 0) {
        setChatHistory(savedHistory);
        setCurrentChatId(savedHistory[0].id);
      } else {
        handleNewChat();
      }

      const preferredMode = await storageService.getPreferredMode();
      if (preferredMode) {
        setCurrentMode(preferredMode);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      handleNewChat();
    }
  };

  const handleNewChat = async () => {
    const newChatId = Date.now().toString();
    const newChat = {
      id: newChatId,
      messages: [{
        id: Date.now().toString(),
        type: 'system',
        content: `Started ${currentMode} mode conversation`,
        timestamp: new Date(),
        mode: currentMode
      }],
      timestamp: new Date(),
      mode: currentMode
    };

    const updatedHistory = [newChat, ...chatHistory];
    
    setChatHistory(updatedHistory);
    setCurrentChatId(newChatId);
    setProcessingError('');

    try {
      await storageService.saveChatHistory(updatedHistory);
    } catch (error) {
      console.error('Failed to save new chat:', error);
    }
  };

  const handleDeleteChat = async (chatId) => {
    const updatedHistory = chatHistory.filter(chat => chat.id !== chatId);
    
    // If we're deleting the current chat
    if (currentChatId === chatId) {
      if (updatedHistory.length > 0) {
        // Switch to the first available chat
        setCurrentChatId(updatedHistory[0].id);
        setCurrentMode(updatedHistory[0].mode || MODES.QUICK_ANSWER);
      } else {
        // If no chats left, set currentChatId to null
        setCurrentChatId(null);
        // Don't create a new chat automatically
      }
    }

    setChatHistory(updatedHistory);

    try {
      await storageService.saveChatHistory(updatedHistory);
    } catch (error) {
      console.error('Failed to save chat deletion:', error);
    }
  };

  const handleSelectChat = (chatId) => {
    const selectedChat = chatHistory.find(chat => chat.id === chatId);
    if (selectedChat) {
      setCurrentChatId(chatId);
      setCurrentMode(selectedChat.mode || currentMode);
      setProcessingError('');
    }
  };

  const handleModeChange = async (mode) => {
    if (mode === currentMode) return;
    
    setCurrentMode(mode);
    await storageService.setPreferredMode(mode);
    
    // Update the current chat's mode instead of creating a new one
    if (currentChatId) {
      const updatedHistory = chatHistory.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            mode: mode,
            messages: [
              ...chat.messages,
              {
                id: Date.now().toString(),
                type: 'system',
                content: `Switched to ${mode} mode`,
                timestamp: new Date(),
                mode: mode
              }
            ]
          };
        }
        return chat;
      });
      
      setChatHistory(updatedHistory);
      await storageService.saveChatHistory(updatedHistory);
    }
  };

  const handleSubmit = async (query, imageUrl = null) => {
    if (!query.trim() && !imageUrl) return;
    
    setProcessingError('');
    setIsProcessing(true);
    
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // If no current chat, create one
      if (!currentChatId) {
        await handleNewChat();
      }

      const currentChat = chatHistory.find(chat => chat.id === currentChatId);
      if (!currentChat) {
        throw new Error('Chat not found');
      }

      const modeSpecificHistory = currentChat.messages.filter(msg => 
        (msg.mode === currentMode || msg.role === 'user') && 
        msg.type !== 'system'
      );

      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: query,
        imageUrl: currentMode === MODES.IMAGE ? imageUrl : null,
        timestamp: new Date(),
        mode: currentMode
      };

      const updatedMessages = [...currentChat.messages, userMessage];
      
      const updatedHistory = chatHistory.map(chat =>
        chat.id === currentChatId
          ? { ...chat, messages: updatedMessages }
          : chat
      );
      setChatHistory(updatedHistory);

      const response = await getAnswer(
        query, 
        currentMode === MODES.IMAGE ? imageUrl : null, 
        modeSpecificHistory, 
        {
          mode: currentMode,
          signal: controller.signal
        }
      );

      if (response.success) {
        const assistantMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.data,
          timestamp: new Date(),
          mode: currentMode,
          model: response.model
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        
        const finalHistory = chatHistory.map(chat =>
          chat.id === currentChatId
            ? { ...chat, messages: finalMessages, mode: currentMode }
            : chat
        );

        setChatHistory(finalHistory);
        await storageService.saveChatHistory(finalHistory);
      } else {
        setProcessingError(response.error || 'Failed to get response');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setProcessingError('Request was cancelled');
      } else {
        console.error('Error in handleSubmit:', error);
        setProcessingError(error.message || 'Failed to get response. Please try again.');
      }
    } finally {
      setIsProcessing(false);
      setAbortController(null);
    }
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsProcessing(false);
    }
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    const isSystem = message.type === 'system';
    
    if (isSystem) {
      return (
        <View key={message.id} style={styles.systemMessage}>
          <Text style={[styles.systemText, { color: colors.textSecondary }]}>
            {message.content}
          </Text>
        </View>
      );
    }

    if (isUser) {
      return (
        <View 
          style={[
            styles.message,
            styles.userMessage,
            { backgroundColor: colors.primary }
          ]}
        >
          <Text style={[styles.messageText, { color: '#fff' }]}>
            {message.content}
          </Text>
          {message.imageUrl && (
            <Image 
              source={{ uri: message.imageUrl }} 
              style={styles.messageImage} 
              resizeMode="contain"
            />
          )}
        </View>
      );
    }

    // For assistant messages, we'll let AnswerDisplay handle the rendering
    return null;
  };

  const currentChat = chatHistory.find(chat => chat.id === currentChatId);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Header 
          onMenuPress={toggleSidebar} 
          onThemeToggle={toggleTheme}
          onShowTerms={onShowTerms}
        />
        
        <View style={styles.mainContainer}>
          <ChatSidebar
            chatHistory={chatHistory}
            currentChatId={currentChat?.id}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            onNewChat={handleNewChat}
            isOpen={isSidebarOpen}
            onClose={toggleSidebar}
          />
          
          <MainContent
            scrollViewRef={scrollViewRef}
            currentMode={currentMode}
            currentChat={currentChat}
            isProcessing={isProcessing}
            processingError={processingError}
            onModeChange={handleModeChange}
            onSubmit={handleSubmit}
            onStop={handleStop}
            renderMessage={renderMessage}
            isSidebarOpen={isSidebarOpen}
            onNewChat={handleNewChat}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  message: {
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 12,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  systemMessage: {
    padding: 8,
    marginVertical: 4,
    alignItems: 'center',
  },
  systemText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  messageImage: {
    width: '100%',
    height: 200,
    marginTop: 8,
    borderRadius: 8,
  }
});

export default HomeScreen;  