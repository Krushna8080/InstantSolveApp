import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { MODES } from '../services/api/constants';

const MODE_ICONS = {
  [MODES.QUICK_ANSWER]: { 
    name: 'flash', 
    description: 'Quick, concise answers',
    hint: 'Get instant answers to simple questions',
    color: '#4F46E5'
  },
  [MODES.LOGICAL_MATH]: { 
    name: 'calculator', 
    description: 'Mathematical solutions',
    hint: 'Solve math problems step by step',
    color: '#0EA5E9'
  },
  [MODES.DETAILED]: { 
    name: 'book', 
    description: 'Detailed explanations',
    hint: 'Get comprehensive answers with examples',
    color: '#39D353'
  },
  [MODES.IMAGE]: { 
    name: 'image', 
    description: 'Analyze images',
    hint: 'Get insights from images and photos',
    color: '#EC4899'
  },
  [MODES.CREATIVE]: { 
    name: 'color-palette', 
    description: 'Creative content',
    hint: 'Generate creative and unique content',
    color: '#F59E0B'
  },
};

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const isSmallScreen = WINDOW_WIDTH < 768;

const ModeSelector = ({ currentMode, onModeChange }) => {
  const { colors, theme } = useTheme();

  const renderModeButton = (mode) => {
    const isSelected = mode === currentMode;
    const icon = MODE_ICONS[mode];

    return (
      <TouchableOpacity
        key={mode}
        style={[
          styles.modeButton,
          {
            backgroundColor: isSelected ? icon.color : theme === 'dark' ? 'rgba(255,255,255,0.05)' : colors.surface,
            borderColor: isSelected ? icon.color : theme === 'dark' ? 'rgba(255,255,255,0.1)' : colors.border,
            transform: [{ scale: isSelected ? 1 : 0.98 }]
          },
        ]}
        onPress={() => onModeChange(mode)}
      >
        <View style={[
          styles.iconContainer,
          {
            backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : theme === 'dark' ? 'rgba(255,255,255,0.1)' : icon.color + '15',
          }
        ]}>
          <Ionicons
            name={icon.name}
            size={isSmallScreen ? 20 : 22}
            color={isSelected ? '#fff' : icon.color}
            style={styles.icon}
          />
        </View>
        {!isSmallScreen && (
          <View style={styles.textContainer}>
            <Text style={[
              styles.modeTitle,
              { color: isSelected ? '#fff' : colors.text }
            ]}>
              {mode.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ')}
            </Text>
            <Text style={[
              styles.modeDescription,
              { color: isSelected ? 'rgba(255,255,255,0.9)' : colors.textSecondary }
            ]} numberOfLines={1}>
              {icon.hint}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        Choose a mode to get started
      </Text>
      <View style={[styles.grid, isSmallScreen && styles.gridSmall]}>
        {Object.values(MODES).map(renderModeButton)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: isSmallScreen ? 12 : 16,
    paddingTop: isSmallScreen ? 8 : 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: isSmallScreen ? 4 : 8,
    textAlign: isSmallScreen ? 'center' : 'left',
    opacity: 0.9,
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    maxWidth: 1200,
    marginHorizontal: 'auto',
  },
  gridSmall: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    gap: 8,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    flexGrow: isSmallScreen ? 0 : 1,
    width: isSmallScreen ? 48 : '18%',
    minWidth: isSmallScreen ? 48 : 160,
    maxWidth: isSmallScreen ? 48 : 200,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        ':hover': {
          transform: 'translateY(-1px) scale(1.02)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
      },
      default: {
        elevation: 1,
      },
    }),
  },
  iconContainer: {
    width: isSmallScreen ? 48 : 40,
    height: isSmallScreen ? 48 : 40,
    borderRadius: isSmallScreen ? 12 : 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    opacity: 1,
  },
  textContainer: {
    flex: 1,
    padding: 10,
    paddingLeft: 8,
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  modeDescription: {
    fontSize: 12,
    opacity: 0.9,
    lineHeight: 16,
  },
});

export default ModeSelector; 