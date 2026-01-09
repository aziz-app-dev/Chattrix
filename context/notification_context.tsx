import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from './auth_context';
import type * as NotificationsType from 'expo-notifications';

interface NotificationData {
  type?: 'message' | 'call';
  conversationId?: string;
  senderName?: string;
  callId?: string;
  callerName?: string;
  callType?: 'audio' | 'video';
}

interface NotificationContextProps {
  expoPushToken: string | null;
  notification: NotificationsType.Notification | null;
  registerAndSaveToken: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps>({
  expoPushToken: null,
  notification: null,
  registerAndSaveToken: async () => {},
});

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { token, isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationsType.Notification | null>(null);
  const [isReady, setIsReady] = useState(false);
  const notificationListener = useRef<NotificationsType.Subscription | null>(null);
  const responseListener = useRef<NotificationsType.Subscription | null>(null);

  // Register for push notifications and save token
  const registerAndSaveToken = async () => {
    console.log('=== FCM TOKEN REGISTRATION START ===');
    console.log('Auth token present:', !!token);

    if (!token) {
      console.log('No auth token, skipping FCM registration');
      return;
    }

    try {
      const { registerForPushNotifications, saveFcmTokenToBackend } = await import('@/services/notification_service');
      console.log('Calling registerForPushNotifications...');
      const pushToken = await registerForPushNotifications();

      console.log('=== FCM TOKEN RESULT ===');
      console.log('Push Token obtained:', pushToken);
      console.log('Token length:', pushToken?.length || 0);

      if (pushToken) {
        setExpoPushToken(pushToken);
        console.log('Saving FCM token to backend...');
        const saved = await saveFcmTokenToBackend(pushToken, token);
        console.log('FCM token saved to backend:', saved);
        console.log('=== CURRENT USER FCM TOKEN ===');
        console.log(pushToken);
        console.log('==============================');
      } else {
        console.log('=== FCM TOKEN FAILED ===');
        console.log('No push token obtained - Firebase may not be initialized');
        console.log('Are you running in Expo Go? You need a development build!');
        console.log('Run: npx eas build --profile development --platform android');
      }
    } catch (error) {
      console.log('=== FCM TOKEN ERROR ===');
      console.log('Push notifications not available:', error);
    }
  };

  // Handle notification navigation based on data
  const handleNotificationNavigation = (data: NotificationData) => {
    console.log('=== NOTIFICATION NAVIGATION ===');
    console.log('Notification data:', data);

    if (!data || !data.type) {
      console.log('No notification type, skipping navigation');
      return;
    }

    if (data.type === 'message' && data.conversationId) {
      console.log('Navigating to chat:', data.conversationId);
      // Navigate to chat screen with conversation data
      router.push({
        pathname: '/chat_screen',
        params: {
          conversationId: data.conversationId,
          name: data.senderName || 'Chat',
        },
      });
    } else if (data.type === 'call' && data.callId) {
      console.log('Navigating to incoming call:', data.callId);
      // For calls, the incoming call screen is handled by call_context via WebSocket
      // The notification just brings the app to foreground
      // If the call is still active, the call_context will show the incoming call screen
      router.push('/(call)/incoming_call_screen');
    }
  };

  // Setup notification listeners
  useEffect(() => {
    let mounted = true;

    const setupListeners = async () => {
      try {
        const Notifications = await import('expo-notifications');

        // Listener for notifications received while app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(
          (notification) => {
            console.log('=== NOTIFICATION RECEIVED (FOREGROUND) ===');
            console.log('Notification:', notification);
            if (mounted) {
              setNotification(notification);
            }
          }
        );

        // Listener for when user taps on notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(
          (response) => {
            console.log('=== NOTIFICATION TAPPED ===');
            console.log('Response:', response);
            const data = response.notification.request.content.data as NotificationData;
            handleNotificationNavigation(data);
          }
        );

        // Check if app was opened from a notification
        const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
        if (lastNotificationResponse && mounted) {
          console.log('=== APP OPENED FROM NOTIFICATION ===');
          const data = lastNotificationResponse.notification.request.content.data as NotificationData;
          // Delay navigation to ensure app is fully loaded
          setTimeout(() => {
            handleNotificationNavigation(data);
          }, 1000);
        }

        console.log('Notification listeners setup complete');
      } catch (error) {
        console.log('Error setting up notification listeners:', error);
      }
    };

    if (isAuthenticated) {
      setupListeners();
    }

    return () => {
      mounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated]);

  // Mark as ready after initial render to prevent blocking
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Register for notifications when authenticated (with delay to prevent blocking)
  useEffect(() => {
    if (isAuthenticated && token && isReady) {
      // Delay registration to not block the main render
      const timer = setTimeout(() => {
        registerAndSaveToken();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, token, isReady]);

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        registerAndSaveToken,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
