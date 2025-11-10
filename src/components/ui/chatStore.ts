import { generateId } from "ai";
import { create } from "zustand";

// Define the active chat state type
interface ActiveChatState {
  chatId: string;
  isStreaming: boolean;
  hasCompletedFirstMessage: boolean;
  title: string | null;
}

// Define the store interface
interface ChatStore {
  activeChats: Map<string, ActiveChatState>;

  // Actions
  createChat: () => string;
  setStreaming: (chatId: string, isStreaming: boolean) => void;
  setChatTitle: (chatId: string, title: string) => void;
  removeChat: (chatId: string) => void;
}

// Create the Zustand store
export const useChatStore = create<ChatStore>((set) => ({
  activeChats: new Map(),

  createChat: () => {
    const id = generateId();

    set((state) => {
      const newActiveChats = new Map(state.activeChats);
      newActiveChats.set(id, {
        chatId: id,
        isStreaming: false,
        hasCompletedFirstMessage: false,
        title: null,
      });
      return { activeChats: newActiveChats };
    });

    return id;
  },

  setStreaming: (chatId: string, isStreaming: boolean) => {
    set((state) => {
      const chat = state.activeChats.get(chatId);
      if (!chat) return state;

      const newActiveChats = new Map(state.activeChats);
      newActiveChats.set(chatId, {
        ...chat,
        isStreaming,
      });
      return { activeChats: newActiveChats };
    });
  },

  setChatTitle: (chatId: string, title: string) => {
    set((state) => {
      const chat = state.activeChats.get(chatId);
      if (!chat) return state;

      const newActiveChats = new Map(state.activeChats);
      newActiveChats.set(chatId, {
        ...chat,
        title,
        hasCompletedFirstMessage: true,
      });
      return { activeChats: newActiveChats };
    });
  },

  removeChat: (chatId: string) => {
    set((state) => {
      const newActiveChats = new Map(state.activeChats);
      // eslint-disable-next-line drizzle/enforce-delete-with-where
      newActiveChats.delete(chatId);
      return { activeChats: newActiveChats };
    });
  },
}));

// Helper to get chat state (for non-React contexts)
export const getChatState = (chatId: string) => {
  return useChatStore.getState().activeChats.get(chatId);
};
