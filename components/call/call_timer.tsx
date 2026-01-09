import MyTxt from "@/components/txt_conponents";
import { colors } from "@/constants/theme";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface CallTimerProps {
  duration: number;
  style?: ViewStyle;
}

const CallTimer = ({ duration, style }: CallTimerProps) => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={[styles.container, style]}>
      <MyTxt color={colors.white} fontSize={16} fontWeight="500">
        {formatDuration(duration)}
      </MyTxt>
    </View>
  );
};

export default CallTimer;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
