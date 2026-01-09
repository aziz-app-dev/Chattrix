import {
  CallContextProps,
  CallProps,
  IncomingCallData,
  PeerConnectionInfo,
} from "@/constants/types";
import { CALL_TIMEOUT_MS } from "@/constants/webrtc_config";
import { initiateCallAPI, updateCallStatusAPI } from "@/services/call_service";
import { socketService } from "@/services/socket_service";
import { webrtcService } from "@/services/webrtc_service";
import { useRouter, useSegments } from "expo-router";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert, Platform } from "react-native";
import { useAuth } from "./auth_context";
import { Camera } from "expo-camera";
import { Audio } from "expo-av";

const CallContext = createContext<CallContextProps>({
  currentCall: null,
  incomingCall: null,
  isInCall: false,
  isCalling: false,
  localStream: null,
  peerConnections: new Map(),
  isAudioMuted: false,
  isVideoOff: false,
  isSpeakerOn: true,
  callDuration: 0,
  hasPermissions: false,
  initiateCall: async () => {},
  acceptCall: async () => {},
  declineCall: () => {},
  endCall: () => {},
  toggleAudio: () => {},
  toggleVideo: () => {},
  toggleSpeaker: () => {},
  switchCamera: async () => {},
  requestCallPermissions: async () => false,
  navigateToOngoingCall: () => {},
});

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const { token, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // State
  const [currentCall, setCurrentCall] = useState<CallProps | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null
  );
  const [isInCall, setIsInCall] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerConnections, setPeerConnections] = useState<
    Map<string, PeerConnectionInfo>
  >(new Map());
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [hasPermissions, setHasPermissions] = useState(false);

  // Refs
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentCallRef = useRef<CallProps | null>(null);

  // Keep currentCallRef in sync
  useEffect(() => {
    currentCallRef.current = currentCall;
  }, [currentCall]);

  // Request camera and microphone permissions
  const requestCallPermissions = useCallback(
    async (type: "audio" | "video"): Promise<boolean> => {
      try {
        // Request audio permission (required for both audio and video calls)
        const audioPermission = await Audio.requestPermissionsAsync();
        if (audioPermission.status !== "granted") {
          Alert.alert(
            "Microphone Permission Required",
            "Please allow microphone access to make calls. Go to Settings > Apps > Chat > Permissions to enable it.",
            [{ text: "OK" }]
          );
          return false;
        }

        // Request camera permission for video calls
        if (type === "video") {
          const cameraPermission = await Camera.requestCameraPermissionsAsync();
          if (cameraPermission.status !== "granted") {
            Alert.alert(
              "Camera Permission Required",
              "Please allow camera access to make video calls. Go to Settings > Apps > Chat > Permissions to enable it.",
              [{ text: "OK" }]
            );
            return false;
          }
        }

        setHasPermissions(true);
        return true;
      } catch (error) {
        console.error("Error requesting permissions:", error);
        Alert.alert(
          "Permission Error",
          "Failed to request permissions. Please try again.",
          [{ text: "OK" }]
        );
        return false;
      }
    },
    []
  );

  // Navigate to ongoing call screen
  const navigateToOngoingCall = useCallback(() => {
    if (currentCallRef.current && (isInCall || isCalling)) {
      const callType = currentCallRef.current.type;
      router.push({
        pathname: "/(call)/call_screen",
        params: { callId: currentCallRef.current._id, callType },
      });
    } else if (incomingCall) {
      router.push("/(call)/incoming_call_screen");
    }
  }, [isInCall, isCalling, incomingCall, router]);

  // Check if user is trying to navigate away from call - redirect back to call screen
  useEffect(() => {
    const isOnCallScreen = segments.includes("(call)");
    const hasActiveCall = isInCall || isCalling || incomingCall;

    if (hasActiveCall && !isOnCallScreen) {
      console.log("Active call detected, redirecting to call screen");
      // Small delay to allow navigation to complete first
      const timer = setTimeout(() => {
        navigateToOngoingCall();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [segments, isInCall, isCalling, incomingCall, navigateToOngoingCall]);

  // Setup peer connection with callbacks
  const setupPeerConnection = useCallback(
    async (peerId: string, peerName: string, peerImg: string | undefined, createOffer: boolean) => {
      if (!currentCallRef.current) return;
      const callId = currentCallRef.current._id;

      const pc = webrtcService.createPeerConnection(
        peerId,
        // On ICE candidate
        (candidate) => {
          socketService.sendIceCandidate(peerId, callId, candidate);
        },
        // On track received
        (stream) => {
          setPeerConnections((prev) => {
            const newMap = new Map(prev);
            const existing = newMap.get(peerId);
            if (existing) {
              newMap.set(peerId, { ...existing, remoteStream: stream });
            }
            return newMap;
          });
        },
        // On connection state change
        (state) => {
          console.log(`Peer ${peerId} connection state:`, state);
          if (state === "connected") {
            setIsInCall(true);
            setIsCalling(false);
            startDurationTimer();
          }
        }
      );

      // Store peer connection info
      setPeerConnections((prev) => {
        const newMap = new Map(prev);
        newMap.set(peerId, {
          peerId,
          peerName,
          peerImg,
          remoteStream: null,
          isAudioMuted: false,
          isVideoOff: false,
        });
        return newMap;
      });

      // Create and send offer if we're the caller
      if (createOffer) {
        try {
          const offer = await webrtcService.createOffer(peerId);
          socketService.sendWebRTCOffer(peerId, callId, offer);
        } catch (error) {
          console.error("Error creating offer:", error);
        }
      }
    },
    []
  );

  const startDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) return;

    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const handleCallEnded = useCallback(() => {
    // Clear timeouts
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Cleanup WebRTC
    webrtcService.cleanup();

    // Reset state
    setCurrentCall(null);
    setIncomingCall(null);
    setIsInCall(false);
    setIsCalling(false);
    setLocalStream(null);
    setPeerConnections(new Map());
    setIsAudioMuted(false);
    setIsVideoOff(false);
    setCallDuration(0);

    // Navigate back
    router.back();
  }, [router]);

  // Setup socket listeners for call events
  useEffect(() => {
    if (!socketService.isConnected()) return;

    // Incoming call
    socketService.onIncomingCall((data: IncomingCallData) => {
      console.log("Incoming call received:", data);
      if (!isInCall && !isCalling) {
        setIncomingCall(data);
        router.push("/(call)/incoming_call_screen");
      }
    });

    // Call answered
    socketService.onCallAnswered(
      async (data: { userId: string; callId: string; accepted: boolean }) => {
        if (
          data.accepted &&
          currentCallRef.current &&
          data.callId === currentCallRef.current._id
        ) {
          // Find the participant info
          const participant = currentCallRef.current.participants.find(
            (p) => p.user._id === data.userId
          );
          if (participant) {
            await setupPeerConnection(
              data.userId,
              participant.user.name,
              participant.user.img,
              true
            );
          }
        }
      }
    );

    // WebRTC offer received
    socketService.onWebRTCOffer(
      async (data: {
        fromUserId: string;
        callId: string;
        sdp: RTCSessionDescriptionInit;
      }) => {
        if (
          currentCallRef.current &&
          data.callId === currentCallRef.current._id
        ) {
          // Make sure we have a peer connection for this user
          if (!webrtcService.hasPeerConnection(data.fromUserId)) {
            const participant = currentCallRef.current.participants.find(
              (p) => p.user._id === data.fromUserId
            );
            if (participant) {
              await setupPeerConnection(
                data.fromUserId,
                participant.user.name,
                participant.user.img,
                false
              );
            }
          }

          try {
            const answer = await webrtcService.handleOffer(
              data.fromUserId,
              data.sdp
            );
            socketService.sendWebRTCAnswer(
              data.fromUserId,
              data.callId,
              answer
            );
          } catch (error) {
            console.error("Error handling offer:", error);
          }
        }
      }
    );

    // WebRTC answer received
    socketService.onWebRTCAnswer(
      async (data: {
        fromUserId: string;
        callId: string;
        sdp: RTCSessionDescriptionInit;
      }) => {
        if (
          currentCallRef.current &&
          data.callId === currentCallRef.current._id
        ) {
          try {
            await webrtcService.handleAnswer(data.fromUserId, data.sdp);
          } catch (error) {
            console.error("Error handling answer:", error);
          }
        }
      }
    );

    // ICE candidate received
    socketService.onIceCandidate(
      async (data: {
        fromUserId: string;
        callId: string;
        candidate: RTCIceCandidateInit;
      }) => {
        if (
          currentCallRef.current &&
          data.callId === currentCallRef.current._id
        ) {
          try {
            await webrtcService.handleIceCandidate(
              data.fromUserId,
              data.candidate
            );
          } catch (error) {
            console.error("Error handling ICE candidate:", error);
          }
        }
      }
    );

    // User joined call
    socketService.onCallUserJoined(
      async (data: { userId: string; callId: string }) => {
        if (
          currentCallRef.current &&
          data.callId === currentCallRef.current._id
        ) {
          const participant = currentCallRef.current.participants.find(
            (p) => p.user._id === data.userId
          );
          if (participant && !webrtcService.hasPeerConnection(data.userId)) {
            await setupPeerConnection(
              data.userId,
              participant.user.name,
              participant.user.img,
              true
            );
          }
        }
      }
    );

    // User left call
    socketService.onCallUserLeft((data: { userId: string; callId: string }) => {
      if (
        currentCallRef.current &&
        data.callId === currentCallRef.current._id
      ) {
        webrtcService.closePeerConnection(data.userId);
        setPeerConnections((prev) => {
          const newMap = new Map(prev);
          newMap.delete(data.userId);
          return newMap;
        });
      }
    });

    // Call ended
    socketService.onCallEnded((data: { callId: string; reason: string }) => {
      if (
        currentCallRef.current &&
        data.callId === currentCallRef.current._id
      ) {
        handleCallEnded();
      }
    });

    // Call declined
    socketService.onCallDeclined((data: { userId: string; callId: string }) => {
      if (
        currentCallRef.current &&
        data.callId === currentCallRef.current._id
      ) {
        // Check if all participants declined
        const remainingParticipants = currentCallRef.current.participants.filter(
          (p) =>
            p.user._id !== data.userId &&
            p.user._id !== user?.id &&
            p.status === "pending"
        );
        if (remainingParticipants.length === 0 && !isInCall) {
          handleCallEnded();
        }
      }
    });

    // Audio/Video toggle events
    socketService.onAudioToggled(
      (data: { userId: string; isMuted: boolean }) => {
        setPeerConnections((prev) => {
          const newMap = new Map(prev);
          const peer = newMap.get(data.userId);
          if (peer) {
            newMap.set(data.userId, { ...peer, isAudioMuted: data.isMuted });
          }
          return newMap;
        });
      }
    );

    socketService.onVideoToggled(
      (data: { userId: string; isVideoOff: boolean }) => {
        setPeerConnections((prev) => {
          const newMap = new Map(prev);
          const peer = newMap.get(data.userId);
          if (peer) {
            newMap.set(data.userId, { ...peer, isVideoOff: data.isVideoOff });
          }
          return newMap;
        });
      }
    );

    return () => {
      socketService.removeAllCallListeners();
    };
  }, [isInCall, isCalling, user?.id, setupPeerConnection, handleCallEnded]);

  // Actions
  const initiateCall = useCallback(
    async (
      participantIds: string[],
      type: "audio" | "video",
      conversationId?: string
    ) => {
      if (!token || isCalling || isInCall) return;

      // Check if WebRTC is available
      if (!webrtcService.isAvailable()) {
        Alert.alert(
          "Calling Not Available",
          "Audio/video calling requires a development build. Please run 'npx expo prebuild' and 'npx expo run:android' or 'npx expo run:ios' to enable calling.",
          [{ text: "OK" }]
        );
        return;
      }

      // Request permissions before starting call
      const permissionsGranted = await requestCallPermissions(type);
      if (!permissionsGranted) {
        console.log("Call permissions not granted");
        return;
      }

      try {
        setIsCalling(true);

        // Get local media stream
        const stream = await webrtcService.getLocalStream(type === "video");
        setLocalStream(stream);

        // Create call via API
        const call = await initiateCallAPI(
          token,
          type,
          participantIds,
          conversationId,
          participantIds.length > 1
        );

        setCurrentCall(call);

        // Join call room
        socketService.joinCall(call._id);

        // Set timeout for no answer
        callTimeoutRef.current = setTimeout(() => {
          if (!isInCall) {
            endCall();
          }
        }, CALL_TIMEOUT_MS);

        // Navigate to call screen
        router.push({
          pathname: "/(call)/call_screen",
          params: { callId: call._id, callType: type },
        });
      } catch (error) {
        console.error("Error initiating call:", error);
        setIsCalling(false);
        webrtcService.cleanup();
      }
    },
    [token, isCalling, isInCall, router]
  );

  const acceptCall = useCallback(async () => {
    if (!incomingCall || !token) return;

    // Request permissions before accepting call
    const permissionsGranted = await requestCallPermissions(incomingCall.callType);
    if (!permissionsGranted) {
      console.log("Call permissions not granted, declining call");
      // Decline call if permissions not granted
      socketService.declineCall(incomingCall.call._id);
      setIncomingCall(null);
      router.back();
      return;
    }

    try {
      // Get local media stream
      const stream = await webrtcService.getLocalStream(
        incomingCall.callType === "video"
      );
      setLocalStream(stream);

      setCurrentCall(incomingCall.call);
      setIncomingCall(null);
      setIsInCall(true);

      // Join call room
      socketService.joinCall(incomingCall.call._id);
      socketService.answerCall(incomingCall.call._id, true);

      // Update call status via API
      await updateCallStatusAPI(token, incomingCall.call._id, "ongoing");

      // Setup peer connections with existing participants
      for (const participant of incomingCall.call.participants) {
        if (
          participant.user._id !== user?.id &&
          participant.status === "joined"
        ) {
          await setupPeerConnection(
            participant.user._id,
            participant.user.name,
            participant.user.img,
            false
          );
        }
      }

      // Navigate to call screen
      router.replace({
        pathname: "/(call)/call_screen",
        params: {
          callId: incomingCall.call._id,
          callType: incomingCall.callType,
        },
      });
    } catch (error) {
      console.error("Error accepting call:", error);
      webrtcService.cleanup();
    }
  }, [incomingCall, token, user, router, setupPeerConnection]);

  const declineCall = useCallback(() => {
    if (!incomingCall) return;

    socketService.declineCall(incomingCall.call._id);

    setIncomingCall(null);
    router.back();
  }, [incomingCall, router]);

  const endCall = useCallback(() => {
    if (!currentCallRef.current) return;

    socketService.endCall(currentCallRef.current._id);
    socketService.leaveCall(currentCallRef.current._id);

    if (token) {
      updateCallStatusAPI(token, currentCallRef.current._id, "ended", "normal");
    }

    handleCallEnded();
  }, [token, handleCallEnded]);

  const toggleAudio = useCallback(() => {
    const newMuted = !isAudioMuted;
    setIsAudioMuted(newMuted);
    webrtcService.toggleAudio(!newMuted);

    if (currentCallRef.current) {
      socketService.toggleAudioNotify(currentCallRef.current._id, newMuted);
    }
  }, [isAudioMuted]);

  const toggleVideo = useCallback(() => {
    const newVideoOff = !isVideoOff;
    setIsVideoOff(newVideoOff);
    webrtcService.toggleVideo(!newVideoOff);

    if (currentCallRef.current) {
      socketService.toggleVideoNotify(currentCallRef.current._id, newVideoOff);
    }
  }, [isVideoOff]);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => !prev);
    // Note: Speaker toggle requires InCallManager from react-native-incall-manager
  }, []);

  const switchCamera = useCallback(async () => {
    await webrtcService.switchCamera();
  }, []);

  return (
    <CallContext.Provider
      value={{
        currentCall,
        incomingCall,
        isInCall,
        isCalling,
        localStream,
        peerConnections,
        isAudioMuted,
        isVideoOff,
        isSpeakerOn,
        callDuration,
        hasPermissions,
        initiateCall,
        acceptCall,
        declineCall,
        endCall,
        toggleAudio,
        toggleVideo,
        toggleSpeaker,
        switchCamera,
        requestCallPermissions,
        navigateToOngoingCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
