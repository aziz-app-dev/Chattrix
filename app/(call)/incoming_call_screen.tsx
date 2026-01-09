import MyTxt from "@/components/txt_conponents";
import { colors } from "@/constants/theme";
import { useCall } from "@/context/call_context";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";

const IncomingCallScreen = () => {
  const { incomingCall, acceptCall, declineCall } = useCall();

  useEffect(() => {
    // Vibrate pattern: vibrate 500ms, pause 500ms, repeat
    const pattern = [500, 500, 500, 500, 500, 500];
    Vibration.vibrate(pattern, true);

    return () => {
      Vibration.cancel();
    };
  }, []);

  if (!incomingCall) return null;

  const isVideoCall = incomingCall.callType === "video";

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
            Incoming {isVideoCall ? "Video" : "Audio"} Call
          </MyTxt>
        </View>
        {incomingCall.isGroupCall && (
          <View style={styles.groupBadge}>
            <Ionicons name="people" size={14} color={colors.white} />
            <MyTxt color={colors.white} fontSize={12} style={{ marginLeft: 4 }}>
              Group
            </MyTxt>
          </View>
        )}
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        <View style={styles.callerInfo}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                incomingCall.callerImg
                  ? { uri: incomingCall.callerImg }
                  : require("@/assets/images/3d_profile.png")
              }
              style={styles.avatar}
            />
            <View style={styles.callIndicator}>
              <View style={styles.pulseOuter}>
                <View style={styles.pulseInner} />
              </View>
            </View>
          </View>

          <MyTxt
            color={colors.neutral900}
            fontSize={28}
            fontWeight="600"
            style={styles.callerName}
          >
            {incomingCall.callerName}
          </MyTxt>

          <MyTxt color={colors.neutral500} fontSize={16}>
            {incomingCall.isGroupCall ? "Group " : ""}
            {isVideoCall ? "Video" : "Voice"} Call
          </MyTxt>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={declineCall}
            activeOpacity={0.8}
          >
            <View style={styles.declineBtnInner}>
              <Ionicons name="close" size={32} color={colors.white} />
            </View>
            <MyTxt color={colors.neutral600} fontSize={14} style={styles.actionText}>
              Decline
            </MyTxt>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={acceptCall}
            activeOpacity={0.8}
          >
            <View style={styles.acceptBtnInner}>
              <Ionicons
                name={isVideoCall ? "videocam" : "call"}
                size={32}
                color={colors.white}
              />
            </View>
            <MyTxt color={colors.neutral600} fontSize={14} style={styles.actionText}>
              Accept
            </MyTxt>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

export default IncomingCallScreen;

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
  groupBadge: {
    flexDirection: "row",
    alignItems: "center",
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
    paddingTop: 50,
    justifyContent: "space-between",
    paddingBottom: 60,
  },
  callerInfo: {
    alignItems: "center",
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
  callIndicator: {
    position: "absolute",
    bottom: 5,
    right: 5,
  },
  pulseOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(34, 197, 94, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  pulseInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.green,
  },
  callerName: {
    marginBottom: 8,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 80,
    paddingHorizontal: 50,
  },
  declineBtn: {
    alignItems: "center",
  },
  acceptBtn: {
    alignItems: "center",
  },
  declineBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.rose,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.rose,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  acceptBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.green,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionText: {
    marginTop: 12,
  },
});
