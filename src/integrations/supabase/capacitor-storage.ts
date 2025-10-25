import { Preferences } from '@capacitor/preferences';

/**
 * Storage adapter pour Capacitor qui utilise Preferences
 * Compatible avec l'interface localStorage de Supabase
 */
export const CapacitorStorage = {
  async getItem(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  },
  
  async setItem(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  },
  
  async removeItem(key: string): Promise<void> {
    await Preferences.remove({ key });
  },
  
  async clear(): Promise<void> {
    await Preferences.clear();
  },
};
