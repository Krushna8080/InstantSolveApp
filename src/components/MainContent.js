import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Platform, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import ModeSelector from './ModeSelector';
import QueryInput from './QueryInput';
import AnswerDisplay from './AnswerDisplay';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

// Add keyframes for slide-in animation
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translate(-50%, -20px);
      }
      to {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    }
  `;
  document.head.appendChild(style);
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const isSmallScreen = WINDOW_WIDTH < 768;

const MODE_DETAILS = {
  quick_answer: { 
    icon: 'flash',
    emoji: '⚡️',
    color: '#4F46E5',
    label: 'Quick Answer',
    description: 'Get instant, concise responses',
    message: 'Ready for rapid responses – ask quick questions for instant answers!'
  },
  logical_math: { 
    icon: 'calculator',
    emoji: '🔢',
    color: '#0EA5E9',
    label: 'Logical Math',
    description: 'Solve mathematical problems step by step',
    message: 'Math mode engaged – solve equations and problems with detailed steps.'
  },
  detailed: { 
    icon: 'book',
    emoji: '📚',
    color: '#39D353',
    label: 'Detailed Mode',
    description: 'Get comprehensive explanations',
    message: 'Detailed mode ready – ask in-depth questions for comprehensive answers.'
  },
  image: { 
    icon: 'image',
    emoji: '📷',
    color: '#EC4899',
    label: 'Image Analysis',
    description: 'Analyze and understand images',
    message: 'Image analysis mode active – upload images for detailed insights.'
  },
  creative: { 
    icon: 'color-palette',
    emoji: '🎨',
    color: '#F59E0B',
    label: 'Creative Mode',
    description: 'Generate creative content',
    message: 'Creative mode activated – unleash your imagination!'
  },
};

const ModeNotification = ({ mode, visible }) => {
  const { colors, theme } = useTheme();
  const modeInfo = MODE_DETAILS[mode];
  
  if (!visible || !modeInfo) return null;

  return (
    <Animatable.View
      animation="fadeInDown"
      duration={400}
      style={[
        styles.modeNotification,
        {
          backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          borderColor: modeInfo.color + '20',
        }
      ]}
    >
      <LinearGradient
        colors={[modeInfo.color + '20', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
      />

      <View style={styles.modeContent}>
        <Animatable.View
          animation="zoomIn"
          delay={100}
          duration={400}
          style={[styles.modeIconWrapper, { backgroundColor: modeInfo.color + '15' }]}
        >
          <Ionicons name={modeInfo.icon} size={20} color={modeInfo.color} />
        </Animatable.View>

        <View style={styles.modeTextContent}>
          <Animatable.Text
            animation="fadeInRight"
            delay={200}
            duration={400}
            style={[styles.modeName, { color: colors.text }]}
          >
            <Text style={[styles.modeLabel, { color: modeInfo.color }]}>
              {mode.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ')}
            </Text>
            <Text style={[styles.modeStatus, { color: colors.textSecondary }]}>
              {' mode'}
            </Text>
          </Animatable.Text>
        </View>
      </View>

      <LinearGradient
        colors={[modeInfo.color + '40', modeInfo.color + '20']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.modeAccent}
      />
    </Animatable.View>
  );
};

const MainContent = ({
  scrollViewRef,
  currentMode,
  currentChat,
  isProcessing,
  processingError,
  onModeChange,
  onSubmit,
  onStop,
  renderMessage,
  onNewChat,
}) => {
  const { colors, theme } = useTheme();
  const messagesEndRef = useRef(null);
  const isInitialLoad = useRef(true);
  const prevMode = useRef(currentMode);
  const prevMessageCount = useRef(0);
  const userInitiatedAction = useRef(false);
  const [showModeNotification, setShowModeNotification] = useState(false);
  const [notificationMode, setNotificationMode] = useState(currentMode);

  // Handle initial load and reload
  useEffect(() => {
    if (currentChat?.messages?.length > 0) {
      scrollToBottom();
      isInitialLoad.current = false;
    }
  }, [currentChat?.id]);

  // Handle mode changes and show notification
  useEffect(() => {
    if (prevMode.current !== currentMode) {
      scrollToBottom();
      prevMode.current = currentMode;
      setNotificationMode(currentMode);
      setShowModeNotification(true);
      const timer = setTimeout(() => {
        setShowModeNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentMode]);

  // Handle new messages
  useEffect(() => {
    const currentMessageCount = currentChat?.messages?.length || 0;
    // Only scroll if it's a user-initiated action or initial load
    if (currentMessageCount > prevMessageCount.current && (userInitiatedAction.current || isInitialLoad.current)) {
      scrollToBottom();
      userInitiatedAction.current = false;
    }
    prevMessageCount.current = currentMessageCount;
  }, [currentChat?.messages]);

  const handleSubmit = (query, imageUrl) => {
    userInitiatedAction.current = true;
    onSubmit(query, imageUrl);
  };

  const scrollToBottom = (delay = 100) => {
    if (scrollViewRef?.current) {
      setTimeout(() => {
        try {
          if (Platform.OS === 'web') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          } else {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        } catch (error) {
          console.warn('Error scrolling to bottom:', error);
        }
      }, delay);
    }
  };

  const renderLoadingIndicator = () => (
    <View style={[styles.loadingContainer, { backgroundColor: colors.primary + '08' }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <View style={styles.loadingContent}>
        <Text style={[styles.loadingText, { color: colors.primary }]}>
          Processing your request...
        </Text>
        {/* <TouchableOpacity 
          onPress={onStop}
          style={[styles.stopButton, { backgroundColor: colors.error + '15' }]}
        >
          <Text style={[styles.stopButtonText, { color: colors.error }]}>Stop</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );

  const renderFeedbackNote = () => (
    <View style={[styles.feedbackContainer, { borderColor: colors.border + '30' }]}>
      <View style={styles.feedbackTextContainer}>
        <Text style={[styles.feedbackText, { color: colors.textSecondary }]}>
          Not satisfied with the response?  
        </Text>


        <TouchableOpacity onPress={onNewChat}>
          <Text style={[styles.feedbackLink, { color: colors.primary }]}>
            Start a new chat
  
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMessageContent = (message, index) => {
    if (message.type === 'system') {
      return (
        <Animatable.View
          animation="fadeIn"
          duration={300}
          style={[
            styles.systemMessage,
            { 
              backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.05)',
              borderColor: colors.primary + '20',
            }
          ]}
        >
          <View style={styles.systemMessageContent}>
            <Ionicons 
              name={MODE_DETAILS[message.mode]?.icon || 'information-circle'} 
              size={16} 
              color={MODE_DETAILS[message.mode]?.color || colors.primary}
              style={styles.systemIcon}
            />
            <Text style={[styles.systemText, { color: colors.textSecondary }]}>
              {message.content}
            </Text>
          </View>
          <View style={[styles.systemDivider, { backgroundColor: colors.border + '40' }]} />
        </Animatable.View>
      );
    }
    return renderMessage(message, index);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[
          theme === 'dark' ? colors.surface : colors.background,
          theme === 'dark' ? colors.background : colors.surface
        ]}
        style={styles.contentGradient}
      >
        <View style={[
          styles.modeContainer,
          { 
            backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            borderBottomColor: colors.border + '20'
          }
        ]}>
          <ModeSelector
            currentMode={currentMode}
            onModeChange={onModeChange}
          />
          <View style={[styles.modeSeparator, {
            backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
          }]}>
            <View style={[styles.modeSeparatorLine, {
              backgroundColor: colors.primary,
            }]} />
          </View>
        </View>

        <View style={styles.chatSection}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={[
              styles.messagesContent,
              !currentChat?.messages?.length && styles.emptyChat
            ]}
            showsVerticalScrollIndicator={false}
            onLayout={() => isInitialLoad.current && scrollToBottom(0)}
          >
            {!currentChat?.messages?.length ? (
              <View style={styles.welcomeContainer}>
                <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                  Welcome to InstantSolve
                </Text>
                <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                  Start asking questions

                  <TouchableOpacity onPress={onNewChat}>
                      <Text style={[styles.feedbackLink, { color: colors.primary }]}>
                       Start a new chat
  
                      </Text>
                  </TouchableOpacity>
                </Text>
              </View>
            ) : (
              <>
                {currentChat.messages.map((message, index) => (
                  <View key={message.id || index}>
                    <View style={styles.messageWrapper}>
                      {renderMessageContent(message, index)}
                      {message.role === 'assistant' && (
                        <>
                          <AnswerDisplay answer={message.content} />
                          {renderFeedbackNote()}
                        </>
                      )}
                    </View>
                  </View>
                ))}
              </>
            )}

            {isProcessing && renderLoadingIndicator()}
            
            {processingError && (
              <View style={[
                styles.errorContainer,
                { 
                  backgroundColor: colors.error + '10',
                  borderColor: colors.error + '20'
                }
              ]}>
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {processingError}
                </Text>
              </View>
            )}
            <View ref={messagesEndRef} style={styles.scrollAnchor} />
          </ScrollView>

          <View style={[
            styles.inputContainer,
            { 
              backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              borderTopColor: colors.border + '20'
            }
          ]}>
            <QueryInput
              currentMode={currentMode}
              isLoading={isProcessing}
              onSubmit={handleSubmit}
              onStop={onStop}
            />
          </View>
        </View>
      </LinearGradient>

      {showModeNotification && (
        <ModeNotification
          mode={notificationMode}
          visible={showModeNotification}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  contentGradient: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  modeContainer: {
    paddingTop: 0,
    paddingBottom: 8,
    paddingHorizontal: isSmallScreen ? 12 : 16,
    borderBottomWidth: 1,
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      },
    }),
  },
  chatSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: isSmallScreen ? 12 : 20,
    paddingBottom: 100,
    gap: 12,
    maxWidth: 800,
    marginHorizontal: 'auto',
    width: '100%',
  },
  emptyChat: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  loadingContainer: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContent: {
    marginLeft: 16,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    margin: isSmallScreen ? 12 : 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      },
    }),
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: isSmallScreen ? 8 : 12,
    borderTopWidth: 1,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      },
    }),
  },
  messageWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  feedbackContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'transparent',
    alignSelf: 'center',
  },
  feedbackTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  feedbackLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  stopButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  stopButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  scrollAnchor: {
    height: 1,
    width: '100%',
  },
  modeSeparator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 2,
    overflow: 'hidden',
  },
  modeSeparatorLine: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    width: '40%',
    height: 2,
    transform: [{ translateX: '-50%' }],
    backgroundImage: 'linear-gradient(to right, transparent, currentColor 20%, currentColor 80%, transparent)',
  },
  modeNotification: {
    position: Platform.select({
      web: 'fixed',
      default: 'absolute'
    }),
    top: isSmallScreen ? 163: 1000,
    left: '30%',
    transform: [{ translateX: '-50%' }],
    width: isSmallScreen ? '85%' : 280,
    maxWidth: Platform.select({
      web: '95%',
      default: 28
    }),
    marginTop: isSmallScreen ? 20 : 0,
    alignSelf: 'center',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 1000,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        animation: 'slideIn 0.3s ease-out',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  modeContent: {
    padding: isSmallScreen ? 8 : 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    zIndex: 2,
  },
  modeIconWrapper: {
    width: isSmallScreen ? 24 : 28,
    height: isSmallScreen ? 24 : 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modeTextContent: {
    flex: 1,
  },
  modeName: {
    fontSize: isSmallScreen ? 13 : 14,
    lineHeight: 18,
    fontFamily: Platform.select({
      web: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Helvetica Neue', sans-serif",
      default: 'System',
    }),
  },
  modeLabel: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  modeStatus: {
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  modeAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 3,
    bottom: 0,
    zIndex: 3,
  },
  systemMessage: {
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  systemMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  systemIcon: {
    opacity: 0.9,
  },
  systemText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  systemDivider: {
    height: 1,
    width: '100%',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 14,
    flex: 1,
  },
  continueButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});

export default MainContent; 