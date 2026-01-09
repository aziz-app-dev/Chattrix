import { io, Socket } from "socket.io-client";
import { BASE_URL } from "@/constants/urls";

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string): Socket {
    if (this.socket?.connected && this.token === token) {
      return this.socket;
    }

    // Disconnect existing socket if any
    this.disconnect();

    this.token = token;

    // Remove trailing slash from BASE_URL if present
    const socketUrl = BASE_URL.replace(/\/$/, "");

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.token = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Chat room methods
  joinRoom(roomId: string): void {
    this.socket?.emit("chat:join", roomId);
  }

  leaveRoom(roomId: string): void {
    this.socket?.emit("chat:leave", roomId);
  }

  // Message methods
  sendMessage(roomId: string, message: string, type: string = "text"): void {
    this.socket?.emit("chat:message", { roomId, message, type });
  }

  sendDirectMessage(
    recipientId: string,
    message: string,
    type: string = "text"
  ): void {
    this.socket?.emit("chat:direct_message", { recipientId, message, type });
  }

  // Typing indicator
  sendTypingStatus(roomId: string, isTyping: boolean): void {
    this.socket?.emit("chat:typing", { roomId, isTyping });
  }

  // Read receipt
  sendReadReceipt(roomId: string, messageIds: string[]): void {
    this.socket?.emit("chat:read", { roomId, messageIds });
  }

  // Profile update notification
  emitProfileUpdate(userId: string, avatar: string): void {
    this.socket?.emit("user:profile_update", { userId, avatar });
  }

  // Online users
  getOnlineUsers(callback: (users: string[]) => void): void {
    this.socket?.emit("users:get_online", callback);
  }

  isUserOnline(
    userId: string,
    callback: (isOnline: boolean) => void
  ): void {
    this.socket?.emit("users:is_online", userId, callback);
  }

  // Event listeners
  onMessage(callback: (data: any) => void): void {
    this.socket?.on("chat:message", callback);
  }

  onDirectMessage(callback: (data: any) => void): void {
    this.socket?.on("chat:direct_message", callback);
  }

  // New message event with conversation data (for conversation list updates)
  onNewMessage(callback: (data: any) => void): void {
    this.socket?.on("chat:new_message", callback);
  }

  offNewMessage(): void {
    this.socket?.off("chat:new_message");
  }

  onTyping(callback: (data: any) => void): void {
    this.socket?.on("chat:typing", callback);
  }

  onReadReceipt(callback: (data: any) => void): void {
    this.socket?.on("chat:read", callback);
  }

  onUserOnline(callback: (data: { userId: string }) => void): void {
    this.socket?.on("user:online", callback);
  }

  onUserOffline(callback: (data: { userId: string }) => void): void {
    this.socket?.on("user:offline", callback);
  }

  onUserJoinedRoom(callback: (data: any) => void): void {
    this.socket?.on("chat:user_joined", callback);
  }

  onUserLeftRoom(callback: (data: any) => void): void {
    this.socket?.on("chat:user_left", callback);
  }

  // Remove specific listeners
  offMessage(): void {
    this.socket?.off("chat:message");
  }

  offDirectMessage(): void {
    this.socket?.off("chat:direct_message");
  }

  offTyping(): void {
    this.socket?.off("chat:typing");
  }

  offReadReceipt(): void {
    this.socket?.off("chat:read");
  }

  offUserOnline(): void {
    this.socket?.off("user:online");
  }

  offUserOffline(): void {
    this.socket?.off("user:offline");
  }

  // ===== CALL METHODS =====

  // Join a call room
  joinCall(callId: string): void {
    this.socket?.emit("call:join", { callId });
  }

  // Leave a call room
  leaveCall(callId: string): void {
    this.socket?.emit("call:leave", { callId });
  }

  // Answer incoming call
  answerCall(callId: string, accepted: boolean): void {
    this.socket?.emit("call:answer", { callId, accepted });
  }

  // Decline call
  declineCall(callId: string): void {
    this.socket?.emit("call:decline", { callId });
  }

  // End call
  endCall(callId: string, reason?: string): void {
    this.socket?.emit("call:end", { callId, reason });
  }

  // Send WebRTC offer
  sendWebRTCOffer(targetUserId: string, callId: string, sdp: any): void {
    this.socket?.emit("webrtc:offer", { targetUserId, callId, sdp });
  }

  // Send WebRTC answer
  sendWebRTCAnswer(targetUserId: string, callId: string, sdp: any): void {
    this.socket?.emit("webrtc:answer", { targetUserId, callId, sdp });
  }

  // Send ICE candidate
  sendIceCandidate(targetUserId: string, callId: string, candidate: any): void {
    this.socket?.emit("webrtc:ice_candidate", { targetUserId, callId, candidate });
  }

  // Toggle audio notification
  toggleAudioNotify(callId: string, isMuted: boolean): void {
    this.socket?.emit("call:toggle_audio", { callId, isMuted });
  }

  // Toggle video notification
  toggleVideoNotify(callId: string, isVideoOff: boolean): void {
    this.socket?.emit("call:toggle_video", { callId, isVideoOff });
  }

  // Call event listeners
  onIncomingCall(callback: (data: any) => void): void {
    this.socket?.on("call:incoming", callback);
  }

  onCallAnswered(callback: (data: any) => void): void {
    this.socket?.on("call:answered", callback);
  }

  onCallUserJoined(callback: (data: any) => void): void {
    this.socket?.on("call:user_joined", callback);
  }

  onCallUserLeft(callback: (data: any) => void): void {
    this.socket?.on("call:user_left", callback);
  }

  onCallEnded(callback: (data: any) => void): void {
    this.socket?.on("call:ended", callback);
  }

  onCallDeclined(callback: (data: any) => void): void {
    this.socket?.on("call:declined", callback);
  }

  onCallStatusUpdate(callback: (data: any) => void): void {
    this.socket?.on("call:status_update", callback);
  }

  onWebRTCOffer(callback: (data: any) => void): void {
    this.socket?.on("webrtc:offer", callback);
  }

  onWebRTCAnswer(callback: (data: any) => void): void {
    this.socket?.on("webrtc:answer", callback);
  }

  onIceCandidate(callback: (data: any) => void): void {
    this.socket?.on("webrtc:ice_candidate", callback);
  }

  onAudioToggled(callback: (data: any) => void): void {
    this.socket?.on("call:audio_toggled", callback);
  }

  onVideoToggled(callback: (data: any) => void): void {
    this.socket?.on("call:video_toggled", callback);
  }

  // Remove call event listeners
  offIncomingCall(): void {
    this.socket?.off("call:incoming");
  }

  offCallAnswered(): void {
    this.socket?.off("call:answered");
  }

  offCallUserJoined(): void {
    this.socket?.off("call:user_joined");
  }

  offCallUserLeft(): void {
    this.socket?.off("call:user_left");
  }

  offCallEnded(): void {
    this.socket?.off("call:ended");
  }

  offCallDeclined(): void {
    this.socket?.off("call:declined");
  }

  offCallStatusUpdate(): void {
    this.socket?.off("call:status_update");
  }

  offWebRTCOffer(): void {
    this.socket?.off("webrtc:offer");
  }

  offWebRTCAnswer(): void {
    this.socket?.off("webrtc:answer");
  }

  offIceCandidate(): void {
    this.socket?.off("webrtc:ice_candidate");
  }

  offAudioToggled(): void {
    this.socket?.off("call:audio_toggled");
  }

  offVideoToggled(): void {
    this.socket?.off("call:video_toggled");
  }

  // Remove all call listeners
  removeAllCallListeners(): void {
    this.offIncomingCall();
    this.offCallAnswered();
    this.offCallUserJoined();
    this.offCallUserLeft();
    this.offCallEnded();
    this.offCallDeclined();
    this.offCallStatusUpdate();
    this.offWebRTCOffer();
    this.offWebRTCAnswer();
    this.offIceCandidate();
    this.offAudioToggled();
    this.offVideoToggled();
  }
}

export const socketService = new SocketService();
