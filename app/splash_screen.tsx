import { useAuth } from "@/context/auth_context";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";

import SplashView from "@/components/splash_view";

const MIN_SPLASH_MS = 2000;

/**
 * Splash gateway route. Kept for deep links / direct navigation; the root
 * layout gate already shows the splash on every app start, so this route is
 * normally never reached. It:
 *  - stays visible for a minimum time
 *  - checks whether the user is logged in (auth token)
 *  - redirects to Home or Get Started.
 */
const SplashScreen = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  const readyToRedirect = minTimeElapsed && !isLoading;

  if (readyToRedirect) {
    return (
      <Redirect
        href={isAuthenticated ? "/(tabs)" : "/(auth)/welcome_screen"}
      />
    );
  }

  return <SplashView />;
};

export default SplashScreen;
