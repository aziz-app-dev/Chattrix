import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import "react-native-reanimated";
import React, { useEffect } from "react";

import { AppAlertHost } from "@/components/custom_alert";
import { ToastHost } from "@/components/toast";

import { colors } from "@/constants/theme";
import { AppDataProvider } from "@/context/app_data_context";
import { AuthProvider } from "@/context/auth_context";
import { CallProvider } from "@/context/call_context";
import { NotificationProvider } from "@/context/notification_context";
import { SocketProvider } from "@/context/socket_context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as NavigationBar from "expo-navigation-bar";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

// Hold the native splash screen until the JS splash (splash_screen.tsx) has
// mounted, so there is never a blank/flashing gap on app start.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Always open on the splash screen while auth is resolved, so protected
// screens (tabs/home) never flash before redirecting to Get Started / Home.
export const unstable_settings = {
  initialRouteName: "splash_screen",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Hide the native splash as soon as the JS splash screen is rendering
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
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
                // animated={false}
                // hidden={false}
                // hideTransitionAnimation="slide"
                // networkActivityIndicatorVisible={false}
                backgroundColor={colors.neutral900}
                // translucent={false}
              />
              {/* Global custom UI feedback hosts (replace default Alert) */}
              <ToastHost />
              <AppAlertHost />
              </ThemeProvider>
            </CallProvider>
          </SocketProvider>
        </NotificationProvider>
        </AppDataProvider>
      </AuthProvider>
    </SafeAreaView>
  );
}
