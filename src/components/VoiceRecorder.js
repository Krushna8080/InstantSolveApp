import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';

const VoiceRecorder = ({ onTranscription, isRecording, setIsRecording }) => {
  const [recording, setRecording] = useState(null);
  const [permissionResponse, setPermissionResponse] = useState(null);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const isLargeScreen = dimensions.width > 768;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => {
      subscription?.remove();
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  async function startRecording() {
    try {
      if (permissionResponse === null) {
        const permission = await Audio.requestPermissionsAsync();
        setPermissionResponse(permission);

        if (permission.status !== 'granted') {
          alert('Please grant microphone permissions to use voice input.');
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      alert('Failed to start recording. Please try again.');
    }
  }

  async function stopRecording() {
    try {
      if (!recording) return;

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      // Mock transcription for testing
      setTimeout(() => {
        onTranscription("This is a simulated voice transcription. In the actual implementation, this would be the text converted from your voice recording.");
      }, 1000);

    } catch (err) {
      console.error('Failed to stop recording', err);
      alert('Failed to process voice recording. Please try again.');
    }
  }

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.micButton,
        isRecording && styles.micButtonRecording,
        isLargeScreen && styles.micButtonLarge
      ]}
      onPress={toggleRecording}
    >
      <Ionicons 
        name={isRecording ? "stop-circle" : "mic"} 
        size={isLargeScreen ? 32 : 28} 
        color={isRecording ? "#fff" : "#4A90E2"} 
      />
      {isLargeScreen && (
        <Text style={[
          styles.buttonText,
          { color: isRecording ? "#fff" : "#4A90E2" }
        ]}>
          {isRecording ? "Stop" : "Voice"}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  micButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  micButtonLarge: {
    width: 'auto',
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    gap: 8,
  },
  micButtonRecording: {
    backgroundColor: '#D32F2F',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VoiceRecorder;