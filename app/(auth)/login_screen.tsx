import BackBtn from "@/components/back_btn_component";
import MyBtn from "@/components/btn_component";
import MyInput from "@/components/input_component";
import MyTxt from "@/components/txt_conponents";
import { colors } from "@/constants/theme";
import { useAuth } from "@/context/auth_context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
    Alert,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

const LoginScreen = () => {
  const emailRef = useRef("");
  const passRef = useRef("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();

  const onsubmit = async () => {
    if (
      !emailRef.current.trim() ||
      !passRef.current.trim()
    ) {
      Alert.alert("Login", "Please fill all the feilds");
      return;
    }
    if (passRef.current.trim().length <= 4) {
      Alert.alert("Login", "Password length must br grater then 4");
    }
    try {
      setLoading(true);
      await signIn(emailRef.current, passRef.current);
    } catch (error: any) {
      console.log("Login error", error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "android" ? "height" : "padding"}
    >
      <ImageBackground
        style={{ flex: 1 }}
        source={require("../../assets/images/bgPattern.png")}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <BackBtn />
          <MyTxt color={colors.white}>Need some help?</MyTxt>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.form}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: 10, marginBottom: 15 }}>
              <MyTxt
                fontWeight={"600"}
                fontSize={28}
                color={colors.black}
                lineHeight={25}
              >
                Get Started
              </MyTxt>
              <MyTxt fontSize={16} color={colors.neutral600}>
                Login to continue
              </MyTxt>
              
              {/* ! email field */}
              <MyInput
                leftIcon={
                  <Ionicons name="at" size={20} color={colors.neutral500} />
                }
                keyboardType="email-address"
                onChangeText={(value: string) => {
                  emailRef.current = value;
                }}
                placeholder="Enter your emial"
              />
              {/* ! password field */}
              <MyInput
                placeholder="Password"
                onChangeText={(value: string) => {
                  passRef.current = value;
                }}
                secureTextEntry={!showPassword}
                rightIcon={
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color={colors.neutral500}
                    onPress={() => setShowPassword((prev) => !prev)}
                  />
                }
                leftIcon={
                  <Ionicons
                    name={"lock-closed-outline"}
                    size={20}
                    color={colors.neutral500}
                  />
                }
              />
              <View style={{ marginTop: 25, marginBottom: 10 }}>
                <MyBtn title="Sign In" loading={loading} onPress={onsubmit} />
              </View>
              <View style={styles.footer}>
                    <Pressable onPress={()=>router.push("/(auth)/register_screen")}>
                  <MyTxt fontWeight={"500"}>
                    {"Do't have an account?  "}
                    <MyTxt
                      color={colors.primary}
                      fontWeight={"800"}
                      fontSize={15}
                    >
                      Sign Up
                    </MyTxt>
                  </MyTxt>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  conatiner: {
    flex: 1,
    // justifyContent: "flex-start",
    // backgroundColor: colors.neutral900,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderCurve: "continuous",
    paddingHorizontal: 20,
    paddingTop: 20,
    marginTop: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignContent:"center",
    alignSelf:"center",
    gap: 5,
  },
  form: {
    gap: 15,
    marginTop: 20,
  },
});
