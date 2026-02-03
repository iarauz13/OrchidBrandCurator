import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActionSheetIOS } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';
import { useSocialStore, ChatMessage } from '@/stores/useSocialStore';
import { useEffect, useState, useRef } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ScalableButton } from '@/components/ui/ScalableButton';
import { useBinderStore } from '@/stores/useBinderStore';
import { useCollectionStore } from '@/stores/useCollectionStore';
import ShareResourceModal from '@/components/ShareResourceModal';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useUIStore();
  const currentTheme = Colors[theme === 'system' ? 'light' : theme];
  const { conversations, messages, sendMessage, markAsRead } = useSocialStore();
  const { binders } = useBinderStore();
  const { collections } = useCollectionStore();

  const [inputText, setInputText] = useState('');
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const conversation = conversations.find(c => c.id === id);
  const chatMessages = messages[id || ''] || [];

  useEffect(() => {
    if (id) markAsRead(id);
  }, [id]);

  const handleSend = () => {
    if (inputText.trim() && id) {
      sendMessage(id, inputText.trim());
      setInputText('');
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }
  };

  const onShareItem = (type: 'store' | 'collection' | 'binder', data: any) => {
    if (id) {
      const text = `Check out this ${type}: ${data.name}`;
      sendMessage(id, text, { type, data });
      setShareModalVisible(false);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }
  };

  const handleShare = () => {
    setShareModalVisible(true);
  };

  const renderAttachment = (attachment: ChatMessage['attachments']) => {
    if (!attachment) return null;

    const { type, data } = attachment;

    return (
      <TouchableOpacity
        style={[styles.attachmentCard, { backgroundColor: currentTheme.backgroundSecondary }]}
        onPress={() => {
          if (type === 'store') {
            router.push(`/brand/${data.id}`);
          } else if (type === 'collection') {
            router.push(`/collection/${data.id}`);
          } else if (type === 'binder') {
            router.push(`/binder/${data.id}`);
          }
        }}
      >
        <View style={styles.attachmentHeader}>
          <FontAwesome
            name={type === 'store' ? 'shopping-bag' : type === 'collection' ? 'folder' : 'book'}
            size={14}
            color={currentTheme.tint}
          />
          <Text style={[styles.attachmentType, { color: currentTheme.textSecondary }]}>
            {type.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.attachmentName, { color: currentTheme.text }]}>{data.name || 'Shared Item'}</Text>
        <Text style={[styles.attachmentDetails, { color: currentTheme.textTertiary }]}>
          {type === 'collection' || type === 'binder' ? `${data.itemCount || 0} items` : 'View store details'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === 'current-user';

    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
        {!isMe && (
          <Image
            source={{ uri: conversation?.otherUser.avatar }}
            style={styles.messageAvatar}
          />
        )}
        <View style={[
          styles.messageBubble,
          isMe ?
            { backgroundColor: currentTheme.tint, borderBottomRightRadius: 4 } :
            { backgroundColor: currentTheme.card, borderBottomLeftRadius: 4 }
        ]}>
          {item.attachments && renderAttachment(item.attachments)}
          <Text style={[styles.messageText, { color: isMe ? '#fff' : currentTheme.text }]}>
            {item.text}
          </Text>
          <Text style={[styles.messageTime, { color: isMe ? 'rgba(255,255,255,0.7)' : currentTheme.textTertiary }]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (!conversation) return null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen
        options={{
          title: conversation.otherUser.name,
          headerBackTitle: 'Messages',
        }}
      />

      <FlatList
        ref={flatListRef}
        data={chatMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={[styles.inputContainer, { backgroundColor: currentTheme.card, borderTopColor: currentTheme.border }]}>
        <TouchableOpacity style={styles.attachButton} onPress={handleShare}>
          <FontAwesome name="plus" size={20} color={currentTheme.tint} />
        </TouchableOpacity>

        <TextInput
          style={[styles.input, { color: currentTheme.text, backgroundColor: currentTheme.backgroundSecondary }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={currentTheme.textTertiary}
          multiline
        />

        <TouchableOpacity
          style={[styles.sendButton, { opacity: inputText.trim() ? 1 : 0.5 }]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <FontAwesome name="send" size={18} color={currentTheme.tint} />
        </TouchableOpacity>
      </View>

      <ShareResourceModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        onShare={onShareItem}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  myMessageRow: {
    alignSelf: 'flex-end',
  },
  otherMessageRow: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  attachmentCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    minWidth: 200,
  },
  attachmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  attachmentType: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  attachmentName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  attachmentDetails: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    borderTopWidth: 1,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    marginHorizontal: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
});
