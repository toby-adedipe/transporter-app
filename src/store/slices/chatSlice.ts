import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TransporterChatMessage } from '@/types/api';

export interface CachedChatMessage extends TransporterChatMessage {
  id: string;
  isError?: boolean;
}

export interface CachedHandoverState {
  emailSent: boolean;
  recipient?: string;
  reference?: string;
}

interface ChatState {
  transporterNumber: string | null;
  messages: CachedChatMessage[];
  handoverState: CachedHandoverState | null;
}

const initialState: ChatState = {
  transporterNumber: null,
  messages: [],
  handoverState: null,
};

const MAX_CACHED_MESSAGES = 100;

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChatTransporter(state, action: PayloadAction<string>) {
      if (state.transporterNumber === action.payload) return;
      state.transporterNumber = action.payload;
      state.messages = [];
      state.handoverState = null;
    },
    appendChatMessage(state, action: PayloadAction<CachedChatMessage>) {
      state.messages.push(action.payload);
      if (state.messages.length > MAX_CACHED_MESSAGES) {
        state.messages = state.messages.slice(-MAX_CACHED_MESSAGES);
      }
    },
    setHandoverState(state, action: PayloadAction<CachedHandoverState | null>) {
      state.handoverState = action.payload;
    },
    clearChat(state) {
      state.messages = [];
      state.handoverState = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase('auth/logout' as any, (state) => {
      state.transporterNumber = null;
      state.messages = [];
      state.handoverState = null;
    });
  },
});

export const {
  setChatTransporter,
  appendChatMessage,
  setHandoverState,
  clearChat,
} = chatSlice.actions;

export default chatSlice.reducer;

