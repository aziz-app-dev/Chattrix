import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "cache:";

// Save data to the offline cache (last successful fetch wins)
export const saveCache = async <T>(key: string, data: T): Promise<void> => {
  try {
    const entry = {
      data,
      savedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch (error) {
    console.log("Cache write failed:", error);
  }
};

// Load data from the offline cache. Returns null when nothing is cached.
export const loadCache = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    return entry.data as T;
  } catch (error) {
    console.log("Cache read failed:", error);
    return null;
  }
};

export const cacheKeys = {
  conversations: (type: string) => `conversations:${type}`,
  messages: (conversationId: string) => `messages:${conversationId}`,
  calls: () => "calls",
};
