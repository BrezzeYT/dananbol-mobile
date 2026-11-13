import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_KEY = '@danabol_mobile_device_id';
const TOKEN_KEY = '@danabol_mobile_auth_token';

export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_KEY);
    if (existing) {
      return existing;
    }
    const newId = String(Math.floor(100000000 + Math.random() * 900000000));
    await AsyncStorage.setItem(DEVICE_KEY, newId);
    return newId;
  } catch {
    return '999888777';
  }
}

export async function getSavedAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveAuthToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error('Failed to save auth token:', e);
  }
}

export async function removeAuthToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error('Failed to remove auth token:', e);
  }
}
