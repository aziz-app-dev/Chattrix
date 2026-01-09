import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';
import { FCM_TOKEN_URL } from '@/constants/urls';

// Register for push notifications and get the token
export const registerForPushNotifications = async (): Promise<string | null> => {
  // Check if it's a physical device
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    const Notifications = await import('expo-notifications');

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Check and request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return null;
    }

    // Try to get FCM token directly
    try {
      const fcmToken = await Notifications.getDevicePushTokenAsync();
      console.log('FCM Token:', fcmToken.data);

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('chat_messages', {
          name: 'Chat Messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366F1',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('calls', {
          name: 'Incoming Calls',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 500, 500],
          lightColor: '#22C55E',
          sound: 'default',
        });
      }

      return fcmToken.data;
    } catch (tokenError) {
      console.log('FCM not initialized - need development build with Firebase:', tokenError);
      return null;
    }
  } catch (error) {
    console.log('Notifications not available:', error);
    return null;
  }
};

// Save FCM token to backend
export const saveFcmTokenToBackend = async (
  token: string,
  authToken: string
): Promise<boolean> => {
  try {
    const platform = Platform.OS as 'android' | 'ios';

    await axios.post(
      FCM_TOKEN_URL,
      { fcmToken: token, platform },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('FCM token saved to backend successfully');
    return true;
  } catch (error) {
    console.log('Error saving FCM token to backend:', error);
    return false;
  }
};

// Remove FCM token from backend (on logout)
export const removeFcmTokenFromBackend = async (
  token: string,
  authToken: string
): Promise<boolean> => {
  try {
    await axios.delete(FCM_TOKEN_URL, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: { fcmToken: token },
    });

    console.log('FCM token removed from backend');
    return true;
  } catch (error) {
    console.log('Error removing FCM token from backend:', error);
    return false;
  }
};
