import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import MyTxt from "./txt_conponents";

const OfflineBanner = () => {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={16} color={colors.white} />
      <MyTxt fontSize={13} color={colors.white} fontWeight="600">
        You're offline. Check your internet connection.
      </MyTxt>
    </View>
  );
};

export default OfflineBanner;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.rose,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
});
