import { MyAnimatedBtn } from "@/components/btn_component";
import MyTxt from "@/components/txt_conponents";
import { colors } from "@/constants/theme";
import { ImageBackground } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

const WelcomeScreen = () => {
  return (
    <ImageBackground
      style={{ flex: 1 }}
      source={require("../../assets/images/bgPattern.png")}
    >
      <View style={styles.contienr}>
        <View style={styles.txtHeader}>
          <MyTxt
            color={colors.white}
            fontSize={43}
            fontWeight={"900"}
            lineHeight={60}
          >
            Chattrix
          </MyTxt>
        </View>
        <Animated.Image
          source={require("../../assets/images/welcome.png")}
          style={styles.img}
          entering={FadeIn.duration(700).springify()}
          resizeMode={"contain"}
        />
        <View style={{ alignItems: "flex-start", alignSelf: "flex-start" }}>
          <MyTxt
            fontSize={33}
            fontWeight={"800"}
            color={colors.white}
            lineHeight={40}
          >
            Stay Connedted
          </MyTxt>
          <MyTxt
            fontSize={33}
            fontWeight={"800"}
            color={colors.white}
            lineHeight={40}
          >
            with your friends
          </MyTxt>
          <MyTxt
            fontSize={33}
            fontWeight={"800"}
            color={colors.white}
            lineHeight={40}
          >
            and family
          </MyTxt>
        </View>
        <MyAnimatedBtn
          title="Get Started"
          bgColor={colors.white}
          activeBgColor={colors.primary}
          onPress={() => router.push("/(auth)/login_screen")}
          fontSize={18}
        />
      </View>
    </ImageBackground>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  contienr: {
    flex: 1,
    justifyContent: "space-between", // ✅ CENTER vertically
    alignItems: "center", // ✅ CENTER horizontally
    paddingHorizontal: 20,
    marginVertical: 40,
  },
  txtHeader: {
    alignItems: "center",
    alignSelf: "center",
    alignContent: "center",
    justifyContent: "center",
  },
  bg: {
    flex: 1,
    backgroundColor: colors.neutral900,
  },
  img: {
    height: 300,
    aspectRatio: 1,
    alignSelf: "center",
  },
});
