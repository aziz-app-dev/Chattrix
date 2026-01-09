import { colors } from "@/constants/theme";
import React from "react";
import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";

type MyTxtProps = {
  children: React.ReactNode;
  fontSize?: number;
  fontWeight?: TextStyle["fontWeight"];
  color?: string;
  lineHeight?: number;
  align?: TextStyle["textAlign"];
  style?: StyleProp<TextStyle>; // ✅ FIX
};


const MyTxt = ({
  children,
  fontSize = 14,
  fontWeight = "400",
  lineHeight = 20,
  color = colors.black,
  align = "left",
  style,
  ...rest
}: MyTxtProps) => {
  return (
    <Text
      {...rest}
      style={[
        styles.base,
        {
          fontSize,
          fontWeight,
          lineHeight,
          color,
          textAlign: align,
        },
        style, // ✅ style LAST → always overrides
      ]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false, // Android fix
    textAlignVertical: "center",
  },
});

export default MyTxt;
