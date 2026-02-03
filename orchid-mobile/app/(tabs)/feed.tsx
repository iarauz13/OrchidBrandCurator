import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';
import { useSocialStore, Conversation } from '@/stores/useSocialStore';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ScalableButton } from '@/components/ui/ScalableButton';
import { useRouter } from 'expo-router';

export default function MessagesScreen() {
  const { theme } = useUIStore();
  const currentTheme = Colors[theme === 'system' ? 'light' : theme];
  const { conversations, loadMocks } = useSocialStore();
  const router = useRouter();

  useEffect(() => {
    if (conversations.length === 0) {
      loadMocks();
    }
  }, []);

  const renderConversation = ({ item }: { item: Conversation }) => (
    <ScalableButton
      style={[styles.convoCard, { backgroundColor: currentTheme.card }]}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View style={styles.avatarContainer}>
        {item.otherUser.avatar ? (
          <Image source={{ uri: item.otherUser.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: currentTheme.backgroundTertiary }]}>
            <FontAwesome name="user" size={24} color={currentTheme.textTertiary} />
          </View>
        )}
        {item.unreadCount > 0 && <View style={[styles.unreadBadge, { backgroundColor: currentTheme.tint }]} />}
      </View>

      <View style={styles.convoInfo}>
        <View style={styles.convoHeader}>
          <Text style={[styles.userName, { color: currentTheme.text }]}>{item.otherUser.name}</Text>
          <Text style={[styles.time, { color: currentTheme.textTertiary }]}>2h</Text>
        </View>
        <Text
          style={[styles.lastMessage, { color: item.unreadCount > 0 ? currentTheme.text : currentTheme.textSecondary, fontWeight: item.unreadCount > 0 ? '600' : '400' }]}
          numberOfLines={1}
        >
          {item.lastMessage?.text || 'Start a conversation'}
        </Text>
      </View>
      <FontAwesome name="chevron-right" size={14} color={currentTheme.textTertiary} style={styles.chevron} />
    </ScalableButton>
  );

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: currentTheme.text }]}>Messages</Text>
            <View style={styles.searchBar}>
              <FontAwesome name="search" size={14} color={currentTheme.textTertiary} />
              <Text style={{ color: currentTheme.textTertiary, marginLeft: 10 }}>Search messages...</Text>
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(150,150,150,0.1)',
  },
  convoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  convoInfo: {
    flex: 1,
    marginLeft: 16,
  },
  convoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
  },
  lastMessage: {
    fontSize: 14,
  },
  chevron: {
    marginLeft: 8,
  }
});
