import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const isSmallScreen = WINDOW_WIDTH < 768;

const Header = ({ onMenuPress, onThemeToggle }) => {
  const { colors, theme } = useTheme();

  return (
    <LinearGradient
      colors={[
        theme === 'dark' ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'
      ]}
      style={[
        styles.header,
        { 
          borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)'
        }
      ]}
    >
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={[
            styles.menuButton,
            { 
              backgroundColor: theme === 'dark' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.08)',
              borderColor: theme === 'dark' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.15)',
            }
          ]}
          onPress={onMenuPress}
        >
          <Ionicons name="menu" size={20} color={colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <View style={styles.titleWrapper}>
            <Text style={[styles.title, { color: colors.text }]}>
              <Text style={[styles.titleBold, { color: colors.text }]}>Instant</Text>
              <Text style={[styles.titleAccent, { color: colors.primary }]}>Solve</Text>
            </Text>
            <View style={[styles.badge, { backgroundColor: colors.primary + '12' }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>AI</Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Second Brain, Quick Solutions
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.themeButton,
          { 
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          }
        ]}
        onPress={onThemeToggle}
        activeOpacity={0.7}
      >
        <Ionicons
          name={theme === 'dark' ? 'sunny' : 'moon'}
          size={18}
          color={theme === 'dark' ? '#FDB813' : '#6B7280'}
          style={styles.themeIcon}
        />
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.025)',
      },
    }),
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
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
  titleContainer: {
    flexDirection: 'column',
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 20,
    letterSpacing: 0.2,
    flexDirection: 'row',
  },
  titleBold: {
    fontWeight: '700',
  },
  titleAccent: {
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    marginLeft: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
    opacity: 0.8,
    letterSpacing: 0.2,
  },
  themeButton: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
          transform: 'translateY(-1px)',
        },
      },
    }),
  },
  themeIcon: {
    opacity: 0.9,
  },
});

export default Header; 