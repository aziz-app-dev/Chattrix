import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, StatusBar, StyleSheet, Text, TouchableOpacity } from "react-native";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastOptions = {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
};

// ---- Imperative singleton API (callable from anywhere: components, contexts, services) ----
type ToastHandler = (options: ToastOptions) => void;
let handler: ToastHandler | null = null;

const emit = (options: ToastOptions) => {
  if (handler) {
    handler(options);
  } else {
    // Host not mounted yet – fall back to console so nothing is lost.
    console.log(`[Toast:${options.type ?? "info"}]`, options.title ?? "", options.message);
  }
};

export const Toast = {
  show: (options: ToastOptions) => emit(options),
  success: (message: string, title?: string) => emit({ type: "success", message, title }),
  error: (message: string, title?: string) => emit({ type: "error", message, title }),
  info: (message: string, title?: string) => emit({ type: "info", message, title }),
  warning: (message: string, title?: string) => emit({ type: "warning", message, title }),
};

const CONFIG: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { icon: "checkmark-circle", color: colors.green },
  error: { icon: "close-circle", color: colors.rose },
  info: { icon: "information-circle", color: colors.primaryDark },
  warning: { icon: "warning", color: colors.primaryDark },
};

// ---- Host component: mount ONCE near the app root ----
const TOP_OFFSET = (Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 44) + 8;

export const ToastHost = () => {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  useEffect(() => {
    handler = (options: ToastOptions) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ type: "info", duration: 3000, ...options });
    };
    return () => {
      handler = null;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    translateY.setValue(-120);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    hideTimer.current = setTimeout(hide, toast.duration ?? 3000);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  if (!toast) return null;

  const cfg = CONFIG[toast.type ?? "info"];

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { top: TOP_OFFSET, transform: [{ translateY }], opacity }]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hide}
        style={[styles.toast, { borderLeftColor: cfg.color }]}
      >
        <Ionicons name={cfg.icon} size={24} color={cfg.color} style={styles.icon} />
        <Animated.View style={styles.textWrap}>
          {!!toast.title && <Text style={styles.title}>{toast.title}</Text>}
          <Text style={styles.message}>{toast.message}</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 99999,
    elevation: 99999,
    paddingHorizontal: 16,
  },
  toast: {
    width: "100%",
    maxWidth: 500,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    borderLeftWidth: 5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: { marginRight: 12 },
  textWrap: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700", color: colors.neutral800, marginBottom: 2 },
  message: { fontSize: 14, color: colors.neutral600, lineHeight: 19 },
});
