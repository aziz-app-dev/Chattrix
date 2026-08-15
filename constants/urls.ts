import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Resolve the backend host automatically:
 *  - The phone is already loading the JS bundle from the Expo dev server, so
 *    the host it used (expoConfig.hostUri) is guaranteed reachable. The
 *    backend runs on the same machine, on the same host.
 *  - Fallbacks: Android emulator -> 10.0.2.2, iOS simulator -> 127.0.0.1.
 */
const getHost = (): string => {
  const hostUri = Constants.expoConfig?.hostUri;
  const hostFromMetro = hostUri?.split(":")[0];

  if (hostFromMetro && hostFromMetro !== "localhost" && hostFromMetro !== "127.0.0.1") {
    return hostFromMetro;
  }
  return Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
};

const HOST = getHost();

export const BASE_URL = `http://${HOST}:5002/`;
export const REGISTER_URL = `${BASE_URL}auth/register`;
export const LOGIN_URL = `${BASE_URL}auth/login`;
export const UPDATE_PROFILE_IMAGE_URL = `${BASE_URL}auth/profile-image`;
export const UPDATE_PROFILE_NAME_URL = `${BASE_URL}auth/profile-name`;
export const FCM_TOKEN_URL = `${BASE_URL}auth/fcm-token`;

// Conversations
export const CONVERSATIONS_URL = `${BASE_URL}conversations`;
export const USERS_URL = `${BASE_URL}conversations/users`;
