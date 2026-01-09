import { colors } from "@/constants/theme";
import React, { useState } from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

type MyInputProps = TextInputProps & {
  placeholder?: string;
  value?: string;
  onChangeText: (text: string) => void;
  bgColor?: string;
  textColor?: string;
  autoCapitalize?: string;
  fontSize?: number;
  marginVertical?: number;
  fontWeight?: "400" | "500" | "600" | "700";
  secureTextEntry?: boolean;

  // Icon props
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const MyInput = ({
  placeholder,
  value,
  onChangeText,
  bgColor = "transparent",
  textColor = colors.black,
  fontSize = 16,
  marginVertical = 8,
  fontWeight = "500",
  autoCapitalize = "none",
  secureTextEntry = false,
  leftIcon,
  rightIcon,
  children: _children,
  ...props
}: MyInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[styles.container, { backgroundColor: bgColor, marginVertical }]}
    >
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: isFocused ? colors.primary : colors.neutral200,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          cursorColor={colors.primary}
          placeholder={placeholder}
          autoCapitalize={autoCapitalize}
          placeholderTextColor={colors.neutral400}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            { color: textColor, fontSize, fontWeight },
            leftIcon ? { paddingLeft: 44 } : undefined,
            rightIcon ? { paddingRight: 44 } : undefined,
          ]}
          secureTextEntry={secureTextEntry}
          {...props}
        />

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 50,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.neutral200,
    backgroundColor: colors.neutral50,
    borderRadius: 50,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 48,
  },
  leftIcon: {
    position: "absolute",
    left: 10,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: 40,
  },
  rightIcon: {
    position: "absolute",
    right: 10,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: 40,
  },
});

export default MyInput;
