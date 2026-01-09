import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../model/user_model.js';

let firebaseInitialized = false;

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
export const initializeFirebase = () => {
  if (firebaseInitialized) {
    console.log('🔥 Firebase already initialized');
    return;
  }

  try {
    // Path to serviceAccountKey.json (in BACKEND root folder)
    const serviceAccountPath = join(__dirname, '../../serviceAccountKey.json');

    // Read and parse the service account file
    const serviceAccountContent = readFileSync(serviceAccountPath, 'utf-8');
    const serviceAccount = JSON.parse(serviceAccountContent);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseInitialized = true;
    console.log('🔥 Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('🔥 Failed to initialize Firebase:', error);
  }
};

// Send notification to specific tokens
export const sendNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> => {
  if (!firebaseInitialized) {
    console.warn('🔥 Firebase not initialized, skipping notification');
    return;
  }

  if (tokens.length === 0) {
    console.log('🔥 No tokens to send notification to');
    return;
  }

  try {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'chat_messages',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(`🔥 Notifications sent: ${response.successCount} success, ${response.failureCount} failed`);

    // Handle failed tokens (remove invalid ones)
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx] as string);
          console.log(`🔥 Failed token: ${tokens[idx]}, error: ${resp.error?.message}`);
        }
      });

      // Remove invalid tokens from database
      if (failedTokens.length > 0) {
        await removeInvalidTokens(failedTokens);
      }
    }
  } catch (error) {
    console.error('🔥 Error sending notification:', error);
  }
};

// Remove invalid FCM tokens from users
const removeInvalidTokens = async (invalidTokens: string[]): Promise<void> => {
  try {
    await User.updateMany(
      {},
      { $pull: { fcmTokens: { token: { $in: invalidTokens } } } }
    );
    console.log(`🔥 Removed ${invalidTokens.length} invalid tokens`);
  } catch (error) {
    console.error('🔥 Error removing invalid tokens:', error);
  }
};

// Send message notification to users
export const sendMessageNotification = async (
  recipientIds: string[],
  senderName: string,
  messageContent: string,
  conversationId: string,
  messageType: string = 'text'
): Promise<void> => {
  try {
    // Get FCM tokens for recipients
    const users = await User.find({ _id: { $in: recipientIds } }).select('fcmTokens');

    const tokens: string[] = [];
    users.forEach(user => {
      if (user.fcmTokens && user.fcmTokens.length > 0) {
        user.fcmTokens.forEach((tokenObj: any) => {
          if (tokenObj.token) {
            tokens.push(tokenObj.token);
          }
        });
      }
    });

    if (tokens.length === 0) {
      console.log('🔥 No FCM tokens found for recipients');
      return;
    }

    // Prepare notification content
    const title = senderName;
    let body = messageContent;
    if (messageType === 'image') {
      body = '📷 Sent an image';
    } else if (messageType === 'file') {
      body = '📎 Sent a file';
    } else if (body.length > 100) {
      body = body.substring(0, 100) + '...';
    }

    const data = {
      type: 'message',
      conversationId,
      senderName,
    };

    await sendNotification(tokens, title, body, data);
  } catch (error) {
    console.error('🔥 Error sending message notification:', error);
  }
};

// Send call notification to users
export const sendCallNotification = async (
  recipientIds: string[],
  callerName: string,
  callType: 'audio' | 'video',
  callId: string
): Promise<void> => {
  try {
    // Get FCM tokens for recipients
    const users = await User.find({ _id: { $in: recipientIds } }).select('fcmTokens');

    const tokens: string[] = [];
    users.forEach(user => {
      if (user.fcmTokens && user.fcmTokens.length > 0) {
        user.fcmTokens.forEach((tokenObj: any) => {
          if (tokenObj.token) {
            tokens.push(tokenObj.token);
          }
        });
      }
    });

    if (tokens.length === 0) {
      console.log('🔥 No FCM tokens found for call recipients');
      return;
    }

    const title = 'Incoming Call';
    const body = `${callerName} is calling you (${callType})`;

    const data = {
      type: 'call',
      callId,
      callerName,
      callType,
    };

    await sendNotification(tokens, title, body, data);
  } catch (error) {
    console.error('🔥 Error sending call notification:', error);
  }
};

// Get FCM tokens for specific user IDs
export const getFcmTokensForUsers = async (userIds: string[]): Promise<string[]> => {
  try {
    const users = await User.find({ _id: { $in: userIds } }).select('fcmTokens');

    const tokens: string[] = [];
    users.forEach(user => {
      if (user.fcmTokens && user.fcmTokens.length > 0) {
        user.fcmTokens.forEach((tokenObj: any) => {
          if (tokenObj.token) {
            tokens.push(tokenObj.token);
          }
        });
      }
    });

    return tokens;
  } catch (error) {
    console.error('🔥 Error getting FCM tokens:', error);
    return [];
  }
};
