import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import TermsAndConditions from '../screens/TermsAndConditions';

const ChatSidebar = ({ 
  chatHistory, 
  currentChatId, 
  onSelectChat, 
  onDeleteChat,
  onNewChat,
  isOpen,
  onClose
}) => {
  const { colors, theme } = useTheme();
  const [showTerms, setShowTerms] = useState(false);
  const [expandedSections, setExpandedSections] = useState(['today']);

  const organizeChats = () => {
    const organized = {
      today: [],
      yesterday: [],
      older: []
    };

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    chatHistory.forEach(chat => {
      const chatDate = new Date(chat.timestamp);
      if (chatDate.toDateString() === now.toDateString()) {
        organized.today.push(chat);
      } else if (chatDate.toDateString() === yesterday.toDateString()) {
        organized.yesterday.push(chat);
      } else {
        organized.older.push(chat);
      }
    });

    return organized;
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const toggleTerms = () => {
    setShowTerms(!showTerms);
  };

  const renderChatItem = (chat) => {
    const isSelected = chat.id === currentChatId;
    return (
      <TouchableOpacity
        key={chat.id}
        style={[
          styles.chatItem,
          {
            backgroundColor: isSelected 
              ? theme === 'dark' 
                ? 'rgba(59, 130, 246, 0.1)' 
                : colors.primary + '08'
              : 'transparent'
          }
        ]}
        onPress={() => onSelectChat(chat.id)}
      >
        <View style={styles.chatItemContent}>
          <Text 
            style={[styles.chatTitle, { color: colors.text }]} 
            numberOfLines={1}
          >
            {chat.title || 'New Chat'}
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDeleteChat(chat.id)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title, chats) => {
    if (!chats.length) return null;
    const isExpanded = expandedSections.includes(title.toLowerCase());

    return (
      <View key={title} style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(title.toLowerCase())}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {title}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        {isExpanded && chats.map(renderChatItem)}
      </View>
    );
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <View style={[
      styles.sidebar,
      { 
        backgroundColor: theme === 'dark' ? colors.surface : colors.background,
        borderRightColor: colors.border + '20'
      }
    ]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.newChatButton,
            { backgroundColor: colors.primary }
          ]}
          onPress={onNewChat}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.newChatText}>New Chat</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.chatList}>
        {Object.entries(organizeChats()).map(([title, chats]) => 
          renderSection(title.charAt(0).toUpperCase() + title.slice(1), chats)
        )}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.termsButton,
          { borderTopColor: colors.border + '20' }
        ]}
        onPress={() => setShowTerms(true)}
      >
        <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
          Terms & Conditions
        </Text>
      </TouchableOpacity>

      <TermsAndConditions 
        visible={showTerms} 
        onClose={() => setShowTerms(false)} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 280,
    height: '100%',
    borderRightWidth: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 8,
  },
  newChatText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  chatList: {
    flex: 1,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chatItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chatItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatTitle: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
    opacity: 0.7,
  },
  termsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
  },
  termsText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default ChatSidebar; 