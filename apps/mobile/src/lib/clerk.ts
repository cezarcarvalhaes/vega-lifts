import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

export const CLERK_PUBLISHABLE_KEY
  = Constants.expoConfig?.extra?.clerkPublishableKey
    ?? process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
    ?? '';

export const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};
