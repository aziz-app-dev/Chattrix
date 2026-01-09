import { colors } from "@/constants/theme";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity
} from "react-native";

type MyBtnProps = {
  title: string;
  onPress: () => void;

  // Colors
  bgColor?: string;
  textColor?: string;

  // Text styles
  fontSize?: number;
  fontWeight?: TextStyle["fontWeight"];

  // States
  disabled?: boolean;
  loading?: boolean;
};

const MyBtn = ({
  title,
  onPress,
  bgColor = colors.primary,
  textColor = colors.black,
  fontSize = 17,
  fontWeight = "700",
  disabled = false,
  loading = false,
}: MyBtnProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        { backgroundColor: bgColor },
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={[
            styles.txt,
            {
              color: textColor,
              fontSize,
              fontWeight,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: 55,
    width:"100%",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 0,
  },
  txt: {
    // base styles only
  },
  disabled: {
    opacity: 0.6,
  },
});


export default MyBtn ;
type MyAnimatedBtnProps = {
  title: string;
  onPress: () => void;
  bgColor?: string;        // initial
  activeBgColor?: string; // animated-to color
  textColor?: string;
  fontSize?: number;
  fontWeight?: TextStyle["fontWeight"];
  disabled?: boolean;
  loading?: boolean;
};

export const MyAnimatedBtn = ({
  title,
  onPress,
  bgColor = colors.primary,
  activeBgColor = colors.white,
  textColor = colors.black,
  fontSize = 16,
  fontWeight = "600",
  disabled = false,
  loading = false,
}: MyAnimatedBtnProps) => {
  const anim = useRef(new Animated.Value(0)).current;

  const animatedBg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [bgColor, activeBgColor],
  });

  return (
    <Pressable
      disabled={disabled || loading}
      onPressIn={() => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }}
      onPressOut={() => {
        Animated.timing(anim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }}
      onPress={onPress}

      style={styles.btn}
    >
      <Animated.View
        style={[
          styles.btn,
          { backgroundColor: animatedBg },
          (disabled || loading) && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <Text
            style={{
              color: textColor,
              fontSize,
              fontWeight,
            }}
          >
            {title}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
};