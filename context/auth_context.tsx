import {
    AuthContextProps,
    DecodedTokenProps,
    UserProps,
} from "@/constants/types";
import { login, register } from "@/services/auth_services";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";

export const AuthContext = createContext<AuthContextProps>({
  token: null,
  user: null,
  isAuthenticated: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateToken: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokden] = useState<string | null>(null);
  const [user, setUser] = useState<UserProps | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadTokens();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTokens = async () => {
    console.log("🔐 Loading tokens...");
    const token = await AsyncStorage.getItem("token");
    console.log("🔐 Token found:", token ? "Yes" : "No");
    if (token) {
      try {
        const decode = jwtDecode<DecodedTokenProps>(token);
        console.log("🔐 Token decoded, exp:", decode.exp, "now:", Date.now() / 1000);
        if (decode.exp && decode.exp < Date.now() / 1000) {
          console.log("🔐 Token expired, removing...");
          await AsyncStorage.removeItem("token");
          goWelcome();
          return;
        }
        console.log("🔐 Token valid, setting user:", decode.user);
        setTokden(token);
        setUser(decode.user);
        goHome();
      } catch (error: any) {
        console.log("🔐 Token decode error:", error);
        goWelcome();
      }
    } else {
      console.log("🔐 No token, going to welcome");
      goWelcome();
    }
  };

  const goHome = () => {
    setTimeout(() => {
      router.replace("/(tabs)");
    }, 1500);
  };
  const goWelcome = () => {
    setTimeout(() => {
      router.replace("/(auth)/welcome_screen");
    }, 1500);
  };

  const updateToken = async (newToken: string) => {
    if (newToken) {
      console.log("🔐 updateToken: Saving token to AsyncStorage...");
      setTokden(newToken);
      await AsyncStorage.setItem("token", newToken);
      // Verify save
      const saved = await AsyncStorage.getItem("token");
      console.log("🔐 updateToken: Token saved successfully:", saved ? "Yes" : "No");
      const decode = jwtDecode<DecodedTokenProps>(newToken);
      setUser(decode.user);
    }
  };
  const signIn = async (email: string, password: string) => {
    console.log("🔐 Signing in...");
    const response = await login(email, password);
    console.log("🔐 Login response received, saving token...");
    await updateToken(response.token);
    console.log("🔐 Token saved, navigating home...");
    router.replace("/(tabs)");
  };
  const signUp = async (email: string, name: string, password: string) => {
    await register(email, name, password);
    router.push("/(auth)/login_screen");
  };
  const signOut = async () => {
    console.log("🔐 Signing out...");
    setTokden(null);
    setUser(null);
    await AsyncStorage.removeItem("token");
    console.log("🔐 Token removed, navigating to welcome...");
    router.replace("/(auth)/welcome_screen");
  };
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated, signUp, signIn, signOut, updateToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
