import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Image, ActivityIndicator, Dimensions, Text } from 'react-native';
import { TextInput } from 'react-native-paper';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import VoiceRecorder from './VoiceRecorder';
import * as ImagePicker from 'expo-image-picker';
import { MODES } from '../services/api/constants';
import * as Animatable from 'react-native-animatable';
import Voice from '@react-native-voice/voice';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const isSmallScreen = WINDOW_WIDTH < 768;

const QueryInput = ({ onSubmit, currentMode, isLoading, disabled, onStop }) => {
  const { colors, theme } = useTheme();
  const [query, setQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [isFocused, setIsFocused] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);

  // Show image picker only in IMAGE mode
  const showImagePicker = currentMode === MODES.IMAGE;

  const requestImagePermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleImageSelect = async () => {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to select image. Please try again.');
    }
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
  };

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      setIsVoiceSupported(true);
    }
  }, []);

  const handleVoiceInput = async () => {
    if (!isVoiceSupported) {
      alert('Voice input is not supported in this browser/platform');
      return;
    }

    try {
      if (isRecording) {
        setIsRecording(false);
        if (window.recognition) {
          window.recognition.stop();
        }
      } else {
        const SpeechRecognition = window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        window.recognition = recognition;

        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setQuery(prev => prev + ' ' + transcript);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
      }
    } catch (error) {
      console.error('Voice input error:', error);
      setIsRecording(false);
      alert('Failed to start voice input. Please try again.');
    }
  };

  const handleSubmit = () => {
    if (query.trim() || selectedImage) {
      onSubmit(query.trim(), selectedImage);
      setQuery('');
      setSelectedImage(null);
      if (window.document && window.document.querySelector('.messages-container')) {
        const container = window.document.querySelector('.messages-container');
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => {
      subscription?.remove();
      if (isRecording) {
        setIsRecording(false);
      }
    };
  }, []);

  // Add new effect to clear image when mode changes
  useEffect(() => {
    if (currentMode !== MODES.IMAGE) {
      setSelectedImage(null);
    }
  }, [currentMode]);

  const getPlaceholder = () => {
    switch (currentMode) {
      case MODES.QUICK_ANSWER:
        return 'Ask a quick question...';
      case MODES.LOGICAL_MATH:
        return 'Enter a mathematical or logical problem...';
      case MODES.DETAILED:
        return 'Ask for a detailed explanation...';
      case MODES.IMAGE:
        return 'Ask about an image...';
      case MODES.CREATIVE:
        return 'Request creative content...';
      default:
        return 'Type your message...';
    }
  };

  return (
    <View style={styles.container}>
      {selectedImage && (
        <View style={[styles.imagePreviewContainer, { backgroundColor: colors.surface }]}>
          <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
          <TouchableOpacity 
            style={[styles.removeImageButton, { backgroundColor: colors.error + 'CC' }]}
            onPress={handleImageRemove}
          >
            <MaterialIcons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={[
        styles.inputContainer,
        { 
          backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : colors.background,
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : colors.primary + '20',
        }
      ]}>
        <TouchableOpacity
          style={[
            styles.voiceButton,
            { 
              backgroundColor: isRecording ? colors.error + '20' : colors.primary + '10',
              transform: [{ scale: isRecording ? 1.05 : 1 }]
            }
          ]}
          onPress={handleVoiceInput}
          disabled={disabled || isLoading}
        >
          <View style={styles.voiceIconWrapper}>
            <Ionicons
              name={isRecording ? "stop" : "mic"}
              size={22}
              color={isRecording ? colors.error : colors.primary}
              style={[
                styles.voiceIcon,
                { opacity: isRecording ? 1 : 0.8 }
              ]}
            />
          </View>
        </TouchableOpacity>

        <TextInput
  value={query}
  onChangeText={setQuery}
  placeholder={getPlaceholder()}
  placeholderTextColor={theme === 'dark' ? '#9CA3AF' : colors.textSecondary + '80'}

  // Force typed text color (Paper v5+)
  textColor={theme === 'dark' ? '#FFFFFF' : colors.text}

  style={[
    styles.input,
    {
      backgroundColor: theme === 'dark' ? '#1E293B' : colors.background,
      // remove color here if using textColor prop
    }
  ]}
  theme={{
    colors: {
      placeholder: theme === 'dark' ? '#9CA3AF' : colors.textSecondary + '80',
      primary: colors.primary,
      // remove "text" if using textColor prop
    },
    dark: theme === 'dark',
    roundness: 8,
  }}
  mode="flat"
  dense={true}
  selectionColor={colors.primary}
  underlineColor="transparent"
  activeUnderlineColor="transparent"
  multiline={false}
  maxHeight={undefined}
  disabled={disabled || isLoading}
/>


        <View style={styles.actionButtons}>
          {showImagePicker && (
            <TouchableOpacity
              style={[
                styles.imageButton,
                { backgroundColor: colors.primary + '10' }
              ]}
              onPress={handleImageSelect}
              disabled={disabled || isLoading}
            >
              <MaterialIcons
                name="image"
                size={22}
                color={colors.primary}
                style={{ opacity: 0.8 }}
              />
            </TouchableOpacity>
          )}

          {isLoading ? (
            <TouchableOpacity
              style={[
                styles.stopButton,
                { backgroundColor: colors.error + '10' }
              ]}
              onPress={onStop}
            >
              <View style={styles.stopButtonContent}>
                <MaterialIcons
                  name="stop"
                  size={22}
                  color={colors.error}
                  style={{ opacity: 0.9 }}
                />
                <Text style={[styles.stopButtonText, { color: colors.error }]}>
                  Stop
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: colors.primary,
                  opacity: (!query.trim() && !selectedImage) || disabled ? 0.5 : 1
                }
              ]}
              onPress={handleSubmit}
              disabled={(!query.trim() && !selectedImage) || disabled || isLoading}
            >
              <MaterialIcons name="send" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 800,
    marginHorizontal: 'auto',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    minHeight: 48,
    maxHeight: 48,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      },
    }),
  },
  voiceButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
          opacity: 0.9,
          transform: 'translateY(-1px)',
        },
      },
    }),
  },
  voiceIconWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  voiceIcon: {
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
      },
    }),
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 0,
    outline: 'none',
    minHeight: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  imageButton: {
    padding: 6,
    borderRadius: 8,
    height: 32,
    width: 32,
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
  sendButton: {
    padding: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
    height: 32,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
          transform: 'translateY(-1px)',
          opacity: 0.95,
        },
      },
      default: {
        elevation: 2,
      },
    }),
  },
  imagePreviewContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
    borderRadius: 8,
  },
  stopButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  stopButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stopButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default QueryInput; 