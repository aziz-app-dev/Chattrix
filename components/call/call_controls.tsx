import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface CallControlsProps {
  isVideoCall: boolean;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => Promise<void>;
  onEndCall: () => void;
}

const CallControls = ({
  isVideoCall,
  isAudioMuted,
  isVideoOff,
  onToggleAudio,
  onToggleVideo,
  onSwitchCamera,
  onEndCall,
}: CallControlsProps) => {
  return (
    <View style={styles.container}>
      {/* Mute Audio */}
      <TouchableOpacity
        style={[styles.button, isAudioMuted && styles.buttonActive]}
        onPress={onToggleAudio}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isAudioMuted ? "mic-off" : "mic"}
          size={24}
          color={isAudioMuted ? colors.white : colors.neutral700}
        />
      </TouchableOpacity>

      {/* Toggle Video (only for video calls) */}
      {isVideoCall && (
        <TouchableOpacity
          style={[styles.button, isVideoOff && styles.buttonActive]}
          onPress={onToggleVideo}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isVideoOff ? "videocam-off" : "videocam"}
            size={24}
            color={isVideoOff ? colors.white : colors.neutral700}
          />
        </TouchableOpacity>
      )}

      {/* End Call */}
      <TouchableOpacity
        style={styles.endCallButton}
        onPress={onEndCall}
        activeOpacity={0.8}
      >
        <Ionicons
          name="call"
          size={28}
          color={colors.white}
          style={styles.endCallIcon}
        />
      </TouchableOpacity>

      {/* Switch Camera (only for video calls) */}
      {isVideoCall && (
        <TouchableOpacity
          style={styles.button}
          onPress={onSwitchCamera}
          activeOpacity={0.8}
        >
          <Ionicons name="camera-reverse" size={24} color={colors.neutral700} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CallControls;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral100,
  },
  button: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.neutral100,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonActive: {
    backgroundColor: colors.neutral600,
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.rose,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.rose,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  endCallIcon: {
    transform: [{ rotate: "135deg" }],
  },
});
