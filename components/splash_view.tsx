import { colors } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

/**
 * Visual splash screen (dark background + logo).
 * Rendered by the root layout gate on app start, so it is ALWAYS visible
 * for the first ~2 seconds regardless of routing.
 */
const SplashView = () => {
  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../assets/images/chat.png")}
        style={styles.img}
        entering={FadeInDown.duration(700).springify()}
      />
    </View>
  );
};

export default SplashView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.neutral900,
  },
  img: {
    height: "23%",
    aspectRatio: 1,
  },
});
