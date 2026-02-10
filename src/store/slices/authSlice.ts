import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TransporterUser } from '@/types/api';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: TransporterUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{
        token: string;
        refreshToken: string;
        user: TransporterUser;
      }>,
    ) {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    tokenRefreshed(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },
    logout(state) {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, tokenRefreshed, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
