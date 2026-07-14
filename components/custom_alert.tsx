import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";

export type AlertButtonStyle = "default" | "cancel" | "destructive";

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: AlertButtonStyle;
};

export type AlertIcon = "success" | "error" | "warning" | "info" | "question";

export type AlertOptions = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  icon?: AlertIcon;
};

// ---- Imperative singleton API (callable from anywhere) ----
type AlertHandler = (options: AlertOptions) => void;
let handler: AlertHandler | null = null;

const emit = (options: AlertOptions) => {
  if (handler) {
    handler(options);
  } else {
    console.log(`[Alert] ${options.title}`, options.message ?? "");
  }
};

export const AppAlert = {
  show: (options: AlertOptions) => emit(options),
  alert: (title: string, message?: string, buttons?: AlertButton[], icon?: AlertIcon) =>
    emit({ title, message, buttons, icon }),
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    opts?: { confirmText?: string; cancelText?: string; destructive?: boolean; onCancel?: () => void }
  ) =>
    emit({
      title,
      message,
      icon: opts?.destructive ? "warning" : "question",
      buttons: [
        { text: opts?.cancelText ?? "Cancel", style: "cancel", onPress: opts?.onCancel },
        {
          text: opts?.confirmText ?? "Confirm",
          style: opts?.destructive ? "destructive" : "default",
          onPress: onConfirm,
        },
      ],
    }),
};

const ICON_CONFIG: Record<AlertIcon, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { name: "checkmark-circle", color: colors.green },
  error: { name: "close-circle", color: colors.rose },
  warning: { name: "warning", color: colors.primaryDark },
  info: { name: "information-circle", color: colors.primaryDark },
  question: { name: "help-circle", color: colors.primaryDark },
};

// ---- Host component: mount ONCE near the app root ----
export const AppAlertHost = () => {
  const [options, setOptions] = useState<AlertOptions | null>(null);
  const [visible, setVisible] = useState(false);
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    handler = (opts: AlertOptions) => {
      setOptions(opts);
      setVisible(true);
    };
    return () => {
      handler = null;
    };
  }, []);

  useEffect(() => {
    if (visible) {
      scale.setValue(0.85);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 6 }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const dismiss = (onPress?: () => void) => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.9, duration: 140, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      setOptions(null);
      onPress?.();
    });
  };

  if (!options) return null;

  const buttons: AlertButton[] =
    options.buttons && options.buttons.length > 0 ? options.buttons : [{ text: "OK" }];
  const icon = options.icon ? ICON_CONFIG[options.icon] : null;

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={() => dismiss()}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => dismiss()} />
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          {icon && (
            <View style={styles.iconWrap}>
              <Ionicons name={icon.name} size={52} color={icon.color} />
            </View>
          )}
          <Text style={styles.title}>{options.title}</Text>
          {!!options.message && <Text style={styles.message}>{options.message}</Text>}

          <View style={[styles.buttonRow, buttons.length > 2 && styles.buttonColumn]}>
            {buttons.map((btn, i) => {
              const isCancel = btn.style === "cancel";
              const isDestructive = btn.style === "destructive";
              return (
                <Pressable
                  key={`${btn.text}-${i}`}
                  onPress={() => dismiss(btn.onPress)}
                  style={({ pressed }) => [
                    styles.button,
                    isCancel ? styles.cancelButton : styles.primaryButton,
                    isDestructive && styles.destructiveButton,
                    buttons.length > 2 && styles.buttonFull,
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel ? styles.cancelText : styles.primaryText,
                      isDestructive && styles.destructiveText,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderCurve: "continuous",
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 18,
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  iconWrap: { marginBottom: 12 },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.neutral800,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: colors.neutral600,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
    width: "100%",
  },
  buttonColumn: {
    flexDirection: "column-reverse",
  },
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonFull: { width: "100%", flex: undefined as unknown as number },
  primaryButton: { backgroundColor: colors.primary },
  cancelButton: { backgroundColor: colors.neutral100 },
  destructiveButton: { backgroundColor: colors.rose },
  buttonText: { fontSize: 16, fontWeight: "700" },
  primaryText: { color: colors.black },
  cancelText: { color: colors.neutral600 },
  destructiveText: { color: colors.white },
});
