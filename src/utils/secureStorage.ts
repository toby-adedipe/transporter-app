import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync('token');
  },
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync('refreshToken');
  },
  async setTokens(token: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
  },
  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('refreshToken');
  },
  async setUser(user: object): Promise<void> {
    await SecureStore.setItemAsync('user', JSON.stringify(user));
  },
  async getUser<T>(): Promise<T | null> {
    const raw = await SecureStore.getItemAsync('user');
    return raw ? JSON.parse(raw) : null;
  },
  async clearAll(): Promise<void> {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
  },
};
