 import { Platform } from "react-native";

 // Physical phone on the same Wi-Fi -> PC's LAN IP; Android emulator -> 10.0.2.2; iOS simulator -> 127.0.0.1
 const HOST =
   Platform.OS === "android"
     ? "192.168.100.9"
     : "127.0.0.1";
 export const BASE_URL = `http://${HOST}:5002/`;
 export const REGISTER_URL = `${BASE_URL}auth/register`;
 export const LOGIN_URL = `${BASE_URL}auth/login`;
 export const UPDATE_PROFILE_IMAGE_URL = `${BASE_URL}auth/profile-image`;
 export const UPDATE_PROFILE_NAME_URL = `${BASE_URL}auth/profile-name`;
 export const FCM_TOKEN_URL = `${BASE_URL}auth/fcm-token`;

 // Conversations
 export const CONVERSATIONS_URL = `${BASE_URL}conversations`;
 export const USERS_URL = `${BASE_URL}conversations/users`;
 