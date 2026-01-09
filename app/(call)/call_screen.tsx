import CallControls from "@/components/call/call_controls";
import CallTimer from "@/components/call/call_timer";
import ParticipantVideo from "@/components/call/participant_video";
import MyTxt from "@/components/txt_conponents";
import { colors } from "@/constants/theme";
import { useAuth } from "@/context/auth_context";
import { useCall } from "@/context/call_context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  StyleSheet,
  View,
} from "react-native";

// Conditionally import RTCView - it requires a development build
let RTCView: any = null;
try {
  RTCView = require("react-native-webrtc").RTCView;
} catch (e) {
  console.warn("react-native-webrtc not available - requires development build");
}

const { width, height } = Dimensions.get("window");

const CallScreen = () => {
  const { callType } = useLocalSearchParams<{
    callId: string;
    callType: "audio" | "video";
  }>();

  const { user } = useAuth();
  const {
    currentCall,
    localStream,
    peerConnections,
    isAudioMuted,
    isVideoOff,
    isCalling,
    callDuration,
    endCall,
    toggleAudio,
    toggleVideo,
    switchCamera,
  } = useCall();

  const isVideoCall = callType === "video";
  const participants = useMemo(() => {
    return Array.from(peerConnections.values());
  }, [peerConnections]);

  // Calculate grid layout based on participant count
  const gridLayout = useMemo(() => {
    const count = participants.length + 1; // +1 for local stream
    if (count <= 1) return { cols: 1, rows: 1 };
    if (count <= 2) return { cols: 2, rows: 1 };
    return { cols: 2, rows: 2 }; // Max 4 participants
  }, [participants.length]);

  const contentHeight = height - 280; // Account for header and controls
  const cellWidth = width / gridLayout.cols - 20;
  const cellHeight = contentHeight / gridLayout.rows - 10;

  const getParticipantNames = () => {
    if (!currentCall) return "Unknown";
    // Filter out current user to show the OTHER participant's name
    const names = currentCall.participants
      .filter((p) => p.user._id !== user?.id && (p.status === "joined" || p.status === "pending"))
      .map((p) => p.user.name);
    return names.length > 0 ? names.join(", ") : "Unknown";
  };

  const getParticipantAvatar = () => {
    if (!currentCall) return null;
    // Filter out current user to show the OTHER participant's avatar
    const participant = currentCall.participants.find(
      (p) => p.user._id !== user?.id && (p.status === "joined" || p.status === "pending")
    );
    return participant?.user.img;
  };

  const getCallStatus = () => {
    if (isCalling) return "Calling...";
    if (participants.length > 0) return "Connected";
    return "Connecting...";
  };

  return (
    <ImageBackground
      style={styles.container}
      source={require("@/assets/images/bgPattern.png")}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Ionicons
            name={isVideoCall ? "videocam" : "call"}
            size={20}
            color={colors.white}
          />
          <MyTxt color={colors.white} fontSize={16} style={{ marginLeft: 8 }}>
            {isVideoCall ? "Video Call" : "Audio Call"}
          </MyTxt>
        </View>
        <CallTimer duration={callDuration} style={styles.headerTimer} />
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {isVideoCall ? (
          /* Video Call UI */
          <View style={styles.videoGrid}>
            {/* Local Video */}
            <View
              style={[styles.videoCell, { width: cellWidth, height: cellHeight }]}
            >
              {localStream && !isVideoOff && RTCView ? (
                <RTCView
                  streamURL={(localStream as any).toURL()}
                  style={styles.video}
                  objectFit="cover"
                  mirror={true}
                />
              ) : (
                <View style={styles.videoPlaceholder}>
                  <Ionicons name="person" size={50} color={colors.neutral400} />
                  <MyTxt color={colors.neutral400} fontSize={14} style={{ marginTop: 8 }}>
                    You
                  </MyTxt>
                </View>
              )}
              <View style={styles.nameTag}>
                <MyTxt color={colors.white} fontSize={11}>
                  You {isAudioMuted && "(Muted)"}
                </MyTxt>
              </View>
            </View>

            {/* Remote Videos */}
            {participants.map((peer) => (
              <ParticipantVideo
                key={peer.peerId}
                peer={peer}
                width={cellWidth}
                height={cellHeight}
              />
            ))}

            {/* Calling Status Overlay for Video Calls */}
            {participants.length === 0 && (
              <View style={styles.callingOverlay}>
                <View style={styles.callingAvatarContainer}>
                  <Image
                    source={
                      getParticipantAvatar()
                        ? { uri: getParticipantAvatar() }
                        : require("@/assets/images/3d_profile.png")
                    }
                    style={styles.callingAvatar}
                  />
                </View>
                <MyTxt
                  color={colors.white}
                  fontSize={20}
                  fontWeight="600"
                  style={{ marginTop: 16 }}
                >
                  {getParticipantNames()}
                </MyTxt>
                <MyTxt color={colors.neutral200} fontSize={16} style={{ marginTop: 4 }}>
                  {getCallStatus()}
                </MyTxt>
              </View>
            )}
          </View>
        ) : (
          /* Audio Call UI */
          <View style={styles.audioCallContainer}>
            <View style={styles.avatarContainer}>
              <Image
                source={
                  getParticipantAvatar()
                    ? { uri: getParticipantAvatar() }
                    : require("@/assets/images/3d_profile.png")
                }
                style={styles.avatar}
              />
              <View style={styles.callStatusIndicator}>
                <Ionicons
                  name={participants.length > 0 ? "checkmark-circle" : "ellipsis-horizontal"}
                  size={24}
                  color={participants.length > 0 ? colors.green : colors.neutral400}
                />
              </View>
            </View>

            <MyTxt
              color={colors.neutral900}
              fontSize={24}
              fontWeight="600"
              style={styles.callerName}
            >
              {getParticipantNames()}
            </MyTxt>

            <MyTxt color={colors.neutral500} fontSize={16}>
              {getCallStatus()}
            </MyTxt>

            {participants.length > 0 && (
              <View style={styles.audioStatusContainer}>
                <View style={styles.audioWave}>
                  <View style={[styles.audioBar, { height: 12 }]} />
                  <View style={[styles.audioBar, { height: 20 }]} />
                  <View style={[styles.audioBar, { height: 16 }]} />
                  <View style={[styles.audioBar, { height: 24 }]} />
                  <View style={[styles.audioBar, { height: 14 }]} />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Controls */}
        <CallControls
          isVideoCall={isVideoCall}
          isAudioMuted={isAudioMuted}
          isVideoOff={isVideoOff}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onSwitchCamera={switchCamera}
          onEndCall={endCall}
        />
      </View>
    </ImageBackground>
  );
};

export default CallScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTimer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  videoGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingBottom: 100,
  },
  videoCell: {
    position: "relative",
    backgroundColor: colors.neutral100,
    borderRadius: 50,
    overflow: "hidden",
  },
  video: {
    flex: 1,
    borderRadius: 20,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.neutral100,
  },
  nameTag: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  audioCallContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 24,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.neutral200,
  },
  callStatusIndicator: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 4,
  },
  callerName: {
    marginBottom: 8,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  audioStatusContainer: {
    marginTop: 30,
  },
  audioWave: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  audioBar: {
    width: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  callingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 50,
     marginBottom: 98,
  },
  callingAvatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.neutral100,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  callingAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
});
