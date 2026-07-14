import { colors } from "@/constants/theme";
import { useAuth } from "@/context/auth_context";
import { Redirect } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

/**
 * Splash gateway. This is the app's initial route (see unstable_settings in
 * app/_layout.tsx). While auth is being resolved we show the splash logo; once
 * resolved we redirect to the right place — so the Home screen never flashes.
 *
 *  - still loading  -> splash logo
 *  - signed in      -> Home (tabs)
 *  - not signed in  -> Auth / Get Started (welcome)
 */
const SplashScreen = () => {
  const { isLoading, isAuthenticated } = useAuth();

  if (!isLoading) {
    return (
      <Redirect href={isAuthenticated ? "/(tabs)" : "/(auth)/welcome_screen"} />
    );
  }

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

export default SplashScreen;

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
