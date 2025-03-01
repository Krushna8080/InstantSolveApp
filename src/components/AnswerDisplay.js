import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, ActivityIndicator, TouchableOpacity, Share, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import { useTheme } from '../context/ThemeContext';
import * as Animatable from 'react-native-animatable';

const WORD_LIMIT = 150; // Limit for initial display

const formatText = (text) => {
  // Format numbered lists with proper spacing and styling
  let formattedText = text.replace(/(\d+\.)([^\n]+)/g, (match, number, content) => {
    return `${number} ${content.trim()}`;
  });
  
  // Add proper paragraph spacing
  formattedText = formattedText.replace(/\n\n/g, '\n\n');
  
  return formattedText;
};

const AnswerDisplay = ({ answer, loading, error, onStop }) => {
  const { colors, theme } = useTheme();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    checkSpeechSupport();
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup: stop speaking when component unmounts
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const checkSpeechSupport = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
    }
  };

  const handleCopy = async () => {
    if (answer) {
      try {
        if (Platform.OS === 'web') {
          await navigator.clipboard.writeText(answer);
        } else {
          await Clipboard.setStringAsync(answer);
        }
        // Use a more subtle notification method
        const notification = document.createElement('div');
        notification.textContent = 'Copied to clipboard!';
        notification.style.cssText = `
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background-color: ${colors.primary};
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.3s ease;
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.style.opacity = '1';
        }, 100);
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 300);
        }, 2000);
      } catch (error) {
        console.error('Failed to copy text: ', error);
        alert('Failed to copy text. Please try again.');
      }
    }
  };

  const handleShare = async () => {
    if (answer) {
      try {
        await Share.share({
          message: answer,
          title: 'Answer from InstantSolve',
        });
      } catch (error) {
        console.error('Failed to share answer: ', error);
      }
    }
  };

  const toggleSpeech = async () => {
    if (!speechSupported) {
      alert('Text-to-speech is not supported in this browser');
      return;
    }

    try {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(answer);
        utterance.rate = 0.9;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (error) => {
          console.error('Speech error:', error);
          setIsSpeaking(false);
        };
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
      alert('Failed to start text-to-speech. Please try again.');
    }
  };

  const renderFormattedText = (text) => {
    if (!text) return null;

    // Split text by lines
    const lines = text.split('\n');
    
    return (
      <View style={styles.textWrapper}>
        {lines.map((line, lineIndex) => {
          // Handle mathematical expressions (between $ or $$)
          if (line.includes('$')) {
            const parts = line.split(/(\$\$?[^$]+\$\$?|\$[^$]+\$)/g);
            return (
              <Text key={lineIndex} style={[styles.lineText, { color: colors.text }]}>
                {parts.map((part, partIndex) => {
                  if (part.startsWith('$$') && part.endsWith('$$')) {
                    // Display block math
                    return (
                      <Text key={partIndex} style={[styles.mathBlock, { color: colors.primary }]}>
                        {part.slice(2, -2)}
                      </Text>
                    );
                  } else if (part.startsWith('$') && part.endsWith('$')) {
                    // Display inline math
                    return (
                      <Text key={partIndex} style={[styles.mathInline, { color: colors.primary }]}>
                        {part.slice(1, -1)}
                      </Text>
                    );
                  }
                  return <Text key={partIndex}>{renderBoldText(part)}</Text>;
                })}
              </Text>
            );
          }

          // Handle bullet points
          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return (
              <View key={lineIndex} style={styles.bulletLine}>
                <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
                <Text style={[styles.lineText, { color: colors.text }]}>
                  {renderBoldText(line.substring(1).trim())}
                </Text>
              </View>
            );
          }
          
          // Handle numbered points (1., 2., etc)
          const numberMatch = line.match(/^(\d+\.)\s*(.+)/);
          if (numberMatch) {
            return (
              <View key={lineIndex} style={styles.numberedLine}>
                <Text style={[styles.number, { color: colors.text }]}>{numberMatch[1]}</Text>
                <Text style={[styles.lineText, { color: colors.text }]}>
                  {renderBoldText(numberMatch[2].trim())}
                </Text>
              </View>
            );
          }

          // Handle section headers (###)
          if (line.startsWith('###')) {
            return (
              <Text key={lineIndex} style={[styles.sectionHeader, { color: colors.text }]}>
                {renderBoldText(line.replace(/###/g, '').trim())}
              </Text>
            );
          }

          // Handle step headers (Step 1:, etc)
          const stepMatch = line.match(/^(Step \d+:)\s*(.+)/);
          if (stepMatch) {
            return (
              <View key={lineIndex} style={styles.stepLine}>
                <Text style={[styles.stepHeader, { color: colors.primary }]}>{stepMatch[1]}</Text>
                <Text style={[styles.lineText, { color: colors.text }]}>
                  {renderBoldText(stepMatch[2].trim())}
                </Text>
              </View>
            );
          }

          // Handle empty lines with proper spacing
          if (!line.trim()) {
            return <View key={lineIndex} style={styles.emptyLine} />;
          }

          // Regular text
          return (
            <Text key={lineIndex} style={[styles.lineText, { color: colors.text }]}>
              {renderBoldText(line)}
            </Text>
          );
        })}
      </View>
    );
  };

  const renderBoldText = (text) => {
    const parts = text.split(/(\{\{bold\}[^{]+\{\{\/bold\}})/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('{{bold}}') && part.endsWith('{{/bold}}')) {
        const content = part.slice(8, -9).trim();
        return (
          <Text key={index} style={[styles.boldText, { color: colors.text }]}>
            {content}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  if (loading) {
    return (
      <Animatable.View 
        animation="fadeIn" 
        style={[styles.container, { backgroundColor: colors.surface }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Animatable.Text 
            animation="pulse" 
            iterationCount="infinite" 
            style={[styles.loadingText, { color: colors.text }]}
          >
            Generating response...
          </Animatable.Text>
          <TouchableOpacity
            style={[styles.stopButton, { backgroundColor: colors.error + '15', borderColor: colors.error }]}
            onPress={onStop}
          >
            <MaterialIcons name="stop" size={20} color={colors.error} />
            <Text style={[styles.stopButtonText, { color: colors.error }]}>Stop</Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    );
  }

  if (error) {
    return (
      <Animatable.View 
        animation="fadeIn" 
        style={[styles.container, { backgroundColor: colors.error + '08' }]}
      >
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={24} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.error + '15', borderColor: colors.error }]}
            onPress={onStop}
          >
            <MaterialIcons name="refresh" size={20} color={colors.error} />
            <Text style={[styles.retryButtonText, { color: colors.error }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    );
  }

  if (!answer) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface + '80' }]}>
        <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
          Ask a question to get an instant answer
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? colors.surface : 'transparent' }]}>
      <ScrollView style={styles.textContainer}>
        {renderFormattedText(answer)}
      </ScrollView>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            { backgroundColor: colors.primary + '15' }
          ]} 
          onPress={handleCopy}
        >
          <MaterialIcons 
            name="content-copy" 
            size={16} 
            color={colors.primary} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.actionButton, 
            { backgroundColor: isSpeaking ? colors.error + '15' : colors.primary + '15' }
          ]} 
          onPress={toggleSpeech}
        >
          <MaterialIcons 
            name={isSpeaking ? "stop" : "volume-up"} 
            size={16} 
            color={isSpeaking ? colors.error : colors.primary} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  textContainer: {
    width: '100%',
  },
  textWrapper: {
    gap: 4,
  },
  bulletLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 8,
    marginVertical: 2,
  },
  numberedLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 4,
    marginVertical: 2,
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    lineHeight: 24,
  },
  number: {
    fontSize: 16,
    marginRight: 8,
    lineHeight: 24,
    minWidth: 24,
  },
  lineText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  boldText: {
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
          transform: 'translateY(-1px)',
          opacity: 0.9,
        },
      },
    }),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
  },
  stopButtonText: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 16,
    borderWidth: 1,
  },
  retryButtonText: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  placeholderText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.8,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  stepLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  stepHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  emptyLine: {
    height: 12,
  },
  mathBlock: {
    fontFamily: Platform.select({
      web: "'Fira Mono', monospace",
      default: 'monospace'
    }),
    fontSize: 15,
    marginVertical: 8,
    lineHeight: 24,
  },
  mathInline: {
    fontFamily: Platform.select({
      web: "'Fira Mono', monospace",
      default: 'monospace'
    }),
    fontSize: 14,
  },
});

export default AnswerDisplay;