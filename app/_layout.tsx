import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import "react-native-reanimated";
import React, { useEffect, useState } from "react";

import { AppAlertHost } from "@/components/custom_alert";
import SplashView from "@/components/splash_view";
import { ToastHost } from "@/components/toast";

import { colors } from "@/constants/theme";
import { AppDataProvider } from "@/context/app_data_context";
import { AuthProvider, useAuth } from "@/context/auth_context";
import { CallProvider } from "@/context/call_context";
import { NotificationProvider } from "@/context/notification_context";
import { SocketProvider } from "@/context/socket_context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as NavigationBar from "expo-navigation-bar";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

// Hold the native splash screen until the JS splash view has mounted, so
// there is never a blank/flashing gap on app start.
SplashScreen.preventAutoHideAsync().catch(() => {});

const MIN_SPLASH_MS = 2000;

/**
 * Gate shown on every app start: renders the splash view until at least
 * MIN_SPLASH_MS have passed AND the auth token has been read, then mounts
 * the navigation Stack (which lands on Home when logged in, or redirects to
 * Get Started via the (tabs) layout guard).
 */
function RootGate() {
  const { isLoading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !minTimeElapsed) {
    return <SplashView />;
  }

  return (
    <>
      <Stack>
        <Stack.Screen
          name="splash_screen"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(auth)/welcome_screen"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(auth)/register_screen"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(auth)/login_screen"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(modal)" options={{ headerShown: false }} />
        <Stack.Screen
          name="chat_screen"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="(call)"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            gestureEnabled: false,
          }}
        />
      </Stack>
      <StatusBar
        style="light"
        backgroundColor={colors.neutral900}
      />
      {/* Global custom UI feedback hosts (replace default Alert) */}
      <ToastHost />
      <AppAlertHost />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Hide the native splash as soon as the JS splash view is rendering
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Safety net: never let the native splash stay stuck even if something hangs
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Set bottom navigation bar button color for Android
  // (setBackgroundColorAsync is unsupported with edge-to-edge enabled,
  //  so only the button style is set here)
  NavigationBar.setButtonStyleAsync("light");

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AuthProvider>
        <AppDataProvider>
          <NotificationProvider>
            <SocketProvider>
            <CallProvider>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <RootGate />
              </ThemeProvider>
            </CallProvider>
          </SocketProvider>
        </NotificationProvider>
        </AppDataProvider>
      </AuthProvider>
    </SafeAreaView>
  );
}
