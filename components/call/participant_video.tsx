import MyTxt from "@/components/txt_conponents";
import { colors } from "@/constants/theme";
import { PeerConnectionInfo } from "@/constants/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

// Conditionally import RTCView - it requires a development build
let RTCView: any = null;
try {
  RTCView = require("react-native-webrtc").RTCView;
} catch (e) {
  // WebRTC not available in Expo Go
}

interface ParticipantVideoProps {
  peer: PeerConnectionInfo;
  width: number;
  height: number;
}

const ParticipantVideo = ({ peer, width, height }: ParticipantVideoProps) => {
  const hasVideo = peer.remoteStream && !peer.isVideoOff && RTCView;

  // Debug logging for video issues
  console.log('=== PARTICIPANT VIDEO DEBUG ===');
  console.log('Peer ID:', peer.peerId);
  console.log('Peer Name:', peer.peerName);
  console.log('Has remote stream:', !!peer.remoteStream);
  console.log('Is video off:', peer.isVideoOff);
  console.log('RTCView available:', !!RTCView);
  console.log('Will show video:', hasVideo);
  if (peer.remoteStream) {
    console.log('Remote stream tracks:', (peer.remoteStream as any).getTracks?.()?.length || 'N/A');
    console.log('Video tracks:', (peer.remoteStream as any).getVideoTracks?.()?.length || 'N/A');
    console.log('Audio tracks:', (peer.remoteStream as any).getAudioTracks?.()?.length || 'N/A');
  }
  console.log('================================');

  return (
    <View style={[styles.container, { width, height }]}>
      {hasVideo ? (
        <RTCView
          streamURL={(peer.remoteStream as any).toURL()}
          style={styles.video}
          objectFit="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          {peer.peerImg ? (
            <Image source={{ uri: peer.peerImg }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={colors.neutral400} />
            </View>
          )}
          <MyTxt color={colors.neutral500} fontSize={14} style={{ marginTop: 8 }}>
            {peer.peerName}
          </MyTxt>
        </View>
      )}

      {/* Name tag */}
      <View style={styles.nameTag}>
        <MyTxt color={colors.white} fontSize={11}>
          {peer.peerName} {peer.isAudioMuted && "(Muted)"}
        </MyTxt>
      </View>

      {/* Muted indicator */}
      {peer.isAudioMuted && (
        <View style={styles.mutedIndicator}>
          <Ionicons name="mic-off" size={14} color={colors.white} />
        </View>
      )}
    </View>
  );
};

export default ParticipantVideo;

const styles = StyleSheet.create({
  container: {
    position: "relative",
    backgroundColor: colors.neutral100,
    borderRadius: 20,
    overflow: "hidden",
  },
  video: {
    flex: 1,
    borderRadius: 20,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.neutral100,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.neutral200,
    justifyContent: "center",
    alignItems: "center",
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
  mutedIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: colors.rose,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
});
