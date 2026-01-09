import { Router } from "expo-router";
import { ReactNode } from "react";
import {
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

export type TypoProps = {
  size?: number;
  color?: string;
  fontWeight?: TextStyle["fontWeight"];
  children: any | null;
  style?: TextStyle;
  textProps?: TextProps;
};

export interface UserProps {
  email: string;
  name: string;
  avatar?: string | null;
  id?: string;
  // Add any additional fields from the token payload as needed
}
export interface UserDataProps {
  name: string;
  email: string;
  avatar?: any;
}

export interface InputProps extends TextInputProps {
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  inputRef?: React.RefObject<TextInput>;
  //   label?: string;
  //   error?: string;
}

export interface DecodedTokenProps {
  user: UserProps;
  exp: number;
  iat: number;
}

export type AuthContextProps = {
  token: string | null;
  user: UserProps | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    avatar?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateToken: (token: string) => Promise<void>;
};

export type ScreenWrapperProps = {
  style?: ViewStyle;
  children: React.ReactNode;
  isModal?: boolean;
  showPattern?: boolean;
  bgOpacity?: number;
};

export type ResponseProps = {
  success: boolean;
  data?: any;
  msg?: string;
};

export interface ButtonProps extends TouchableOpacityProps {
  style?: ViewStyle;
  onPress?: () => void;
  loading?: boolean;
  children: React.ReactNode;
}

export type BackButtonProps = {
  style?: ViewStyle;
  color?: string;
  iconSize?: number;
};

export type AvatarProps = {
  size?: number;
  uri: string | null;
  style?: ViewStyle;
  isGroup?: boolean;
};

export type HeaderProps = {
  title?: string;
  style?: ViewStyle;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export type ConversationListItemProps = {
  item: ConversationProps;
  showDivider: boolean;
  isGroup?: boolean;
  router: Router;
};

export type ConversationProps = {
  _id: string;
  type: "direct" | "group";
  avatar: string | null;
  participants: {
    _id: string;
    name: string;
    avatar: string;
    email: string;
  }[];
  name?: string;
  lastMessage?: {
    _id: string;
    content: string;
    senderId: string;
    type: "text" | "image" | "file";
    attachment?: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type MessageProps = {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
  };
  content: string;
  attachement?: string | null;
  isMe?: boolean;
  createdAt: string;
};

// Socket Types
export type SocketMessageData = {
  id: string;
  senderId: string;
  roomId: string;
  message: string;
  type: string;
  timestamp: string;
};

export type SocketDirectMessageData = {
  id: string;
  senderId: string;
  recipientId: string;
  message: string;
  type: string;
  timestamp: string;
};

export type SocketTypingData = {
  userId: string;
  roomId: string;
  isTyping: boolean;
};

export type SocketReadReceiptData = {
  userId: string;
  roomId: string;
  messageIds: string[];
  timestamp: string;
};

export type SocketNewMessageData = {
  id: string;
  conversationId: string;
  content: string;
  type: string;
  senderId: string;
  senderName: string;
  senderImg?: string;
  timestamp: string;
  conversation: ConversationProps;
};

export type SocketContextProps = {
  isConnected: boolean;
  onlineUsers: string[];
  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, message: string, type?: string) => void;
  sendDirectMessage: (
    recipientId: string,
    message: string,
    type?: string
  ) => void;
  sendTypingStatus: (roomId: string, isTyping: boolean) => void;
  sendReadReceipt: (roomId: string, messageIds: string[]) => void;
  emitProfileUpdate: (userId: string, avatar: string) => void;
  onMessage: (callback: (data: SocketMessageData) => void) => void;
  onDirectMessage: (callback: (data: SocketDirectMessageData) => void) => void;
  onNewMessage: (callback: (data: SocketNewMessageData) => void) => void;
  onTyping: (callback: (data: SocketTypingData) => void) => void;
  onUserOnline: (callback: (data: { userId: string }) => void) => void;
  onUserOffline: (callback: (data: { userId: string }) => void) => void;
  offMessage: () => void;
  offDirectMessage: () => void;
  offNewMessage: () => void;
  offTyping: () => void;
};

// ===== BLUETOOTH LOW ENERGY TYPES =====

export interface BLEDevice {
  id: string;
  name: string | null;
  rssi: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  lastSeen: string;
}

export interface BLEMessage {
  _id: string;
  content: string;
  type: "text" | "system";
  sender: {
    _id: string;
    name: string;
    img?: string;
  };
  createdAt: string;
  status: "sending" | "sent" | "failed";
}

export interface BLEConversation {
  deviceId: string;
  deviceName: string;
  lastMessage?: BLEMessage;
  messages: BLEMessage[];
  updatedAt: string;
  createdAt: string;
}

export interface BluetoothContextProps {
  isScanning: boolean;
  isBluetoothEnabled: boolean;
  isPermissionGranted: boolean;
  discoveredDevices: BLEDevice[];
  connectedDevice: BLEDevice | null;
  conversations: BLEConversation[];
  requestPermissions: () => Promise<boolean>;
  startScan: () => void;
  stopScan: () => void;
  connectToDevice: (deviceId: string) => Promise<boolean>;
  disconnectDevice: () => void;
  sendMessage: (content: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  onMessageReceived: (callback: (message: BLEMessage) => void) => void;
  offMessageReceived: () => void;
}

// BLE Protocol Constants
export const BLE_SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
export const BLE_CHARACTERISTIC_UUID = "12345678-1234-5678-1234-56789abcdef1";
export const BLE_MTU_SIZE = 512;
export const BLE_CHUNK_SIZE = 500;

// ===== CALL TYPES =====

export interface CallParticipant {
  user: {
    _id: string;
    name: string;
    email: string;
    img?: string;
  };
  joinedAt?: string;
  leftAt?: string;
  status: "pending" | "joined" | "left" | "declined" | "missed";
}

export interface CallProps {
  _id: string;
  type: "audio" | "video";
  status:
    | "initiated"
    | "ringing"
    | "ongoing"
    | "ended"
    | "missed"
    | "declined"
    | "failed";
  initiator: {
    _id: string;
    name: string;
    email: string;
    img?: string;
  };
  participants: CallParticipant[];
  conversation?: string;
  isGroupCall: boolean;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IncomingCallData {
  call: CallProps;
  callId: string;
  callerId: string;
  callerName: string;
  callerImg?: string;
  callType: "audio" | "video";
  isGroupCall: boolean;
}

export interface PeerConnectionInfo {
  peerId: string;
  peerName: string;
  peerImg?: string;
  remoteStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoOff: boolean;
}

export interface CallContextProps {
  // State
  currentCall: CallProps | null;
  incomingCall: IncomingCallData | null;
  isInCall: boolean;
  isCalling: boolean;
  localStream: MediaStream | null;
  peerConnections: Map<string, PeerConnectionInfo>;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  callDuration: number;
  hasPermissions: boolean;

  // Actions
  initiateCall: (
    participantIds: string[],
    type: "audio" | "video",
    conversationId?: string
  ) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  switchCamera: () => Promise<void>;
  requestCallPermissions: (type: "audio" | "video") => Promise<boolean>;
  navigateToOngoingCall: () => void;
}
