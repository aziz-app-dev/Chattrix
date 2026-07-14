import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { colors } from "@/constants/theme";
import { useAuth } from "@/context/auth_context";

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Never show Home before auth is known / to a logged-out user.
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/welcome_screen" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.white,
        tabBarInactiveBackgroundColor: colors.neutral900,
        tabBarActiveBackgroundColor: colors.neutral900,
        tabBarStyle: {
          backgroundColor: colors.neutral900, // <-- Full tab bar background
          borderTopWidth: 0, // optional: remove top border
          height: 65,
          paddingTop: 7, // optional: adjust height
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles-sharp" size={28}  color={color}  />
          ),
        }}
      />
      <Tabs.Screen
        name="audio"
        options={{
          title: "Calls",
          tabBarIcon: ({ color }) => (
           <FontAwesome name="phone" size={28}  color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
