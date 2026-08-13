import { colors } from "@/constants/theme";
import { useAppData } from "@/context/app_data_context";
import { useAuth } from "@/context/auth_context";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const MIN_SPLASH_MS = 2000;

/**
 * Splash gateway. First page shown on app start. It:
 *  - stays visible for a minimum time so it always appears on launch
 *  - checks whether the user is logged in (auth token)
 *  - when signed in, loads the cached conversations / groups / messages /
 *    call history instantly and keeps refreshing them from the API in the
 *    background, then redirects to Home.
 */
const SplashScreen = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const { isInitialLoading } = useAppData();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  const readyToRedirect =
    minTimeElapsed &&
    !isLoading &&
    (!isAuthenticated || !isInitialLoading);

  if (readyToRedirect) {
    return (
      <Redirect
        href={isAuthenticated ? "/(tabs)" : "/(auth)/welcome_screen"}
      />
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
