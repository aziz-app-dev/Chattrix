import { colors } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const SplashScreen = () => {

  return (
    <View style={styles.constiner}>
      <Animated.Image source={require("../assets/images/chat.png")}
      style={styles.img}
      entering={FadeInDown.duration(700).springify()}
      />
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  constiner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.neutral900,
  },
  img: {
    height:"23%",
    aspectRatio: 1,
  },
});
