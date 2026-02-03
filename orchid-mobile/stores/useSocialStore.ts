import { create } from 'zustand';
import { StoreItem, Collection, Binder } from '@/types/models';

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  attachments?: {
    type: 'store' | 'selection' | 'collection' | 'binder';
    data: any; // Simplified for MVP
  };
}

export interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  lastMessage?: ChatMessage;
  unreadCount: number;
}

interface SocialState {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>; // chat_id -> messages

  // Actions
  sendMessage: (chatId: string, text: string, attachments?: ChatMessage['attachments']) => void;
  markAsRead: (chatId: string) => void;
  loadMocks: () => void;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  conversations: [],
  messages: {},

  sendMessage: (chatId, text, attachments) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      senderId: 'current-user', // Hardcoded for MVP
      text,
      timestamp: Date.now(),
      attachments,
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), newMessage],
      },
      conversations: state.conversations.map((c) =>
        c.id === chatId ? { ...c, lastMessage: newMessage } : c
      ),
    }));
  },

  markAsRead: (chatId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      ),
    }));
  },

  loadMocks: () => {
    const mockConvos: Conversation[] = [
      {
        id: '1',
        otherUser: { id: 'u1', name: 'Sofia Chen', avatar: 'https://i.pravatar.cc/150?u=u1' },
        unreadCount: 2,
        lastMessage: { id: 'm3', senderId: 'u1', text: 'I just sent you my new Summer Collection!', timestamp: Date.now() },
      },
      {
        id: '2',
        otherUser: { id: 'u2', name: 'James Wilson', avatar: 'https://i.pravatar.cc/150?u=u2' },
        unreadCount: 0,
        lastMessage: { id: 'm2', senderId: 'u2', text: 'Check out this minimalist binder I made.', timestamp: Date.now() - 1000 * 60 * 60 * 24 },
      },
    ];

    const mockMessages: Record<string, ChatMessage[]> = {
      '1': [
        { id: 'm1', senderId: 'u1', text: 'Hey there! Check out this store I found.', timestamp: Date.now() - 1000 * 60 * 60 * 2, attachments: { type: 'store', data: { name: 'Acne Studios', id: 'acne' } } },
        { id: 'm2', senderId: 'current-user', text: 'Ooh, that looks great! Do you have a collection for it?', timestamp: Date.now() - 1000 * 60 * 60 },
        { id: 'm3', senderId: 'u1', text: 'I just sent you my new Summer Collection!', timestamp: Date.now(), attachments: { type: 'collection', data: { name: 'Summer 2024 Curation', id: 'summer', itemCount: 12 } } },
      ],
      '2': [
        { id: 'm4', senderId: 'u2', text: 'Check out this minimalist binder I made.', timestamp: Date.now() - 1000 * 60 * 60 * 24, attachments: { type: 'binder', data: { name: 'Minimalist Essentials', id: 'min', itemCount: 5 } } },
      ]
    };

    set({ conversations: mockConvos, messages: mockMessages });
  },
}));
