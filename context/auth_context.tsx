import {
    AuthContextProps,
    DecodedTokenProps,
    UserProps,
} from "@/constants/types";
import { Toast } from "@/components/toast";
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
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateToken: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokden] = useState<string | null>(null);
  const [user, setUser] = useState<UserProps | null>(null);
  // true while we read the stored token on startup; the splash screen waits on this.
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadTokens();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only resolve the auth state here. Navigation is handled by the splash gateway
  // (app/splash_screen.tsx) so the home screen never flashes before we know the state.
  const loadTokens = async () => {
    console.log("🔐 Loading tokens...");
    try {
      const stored = await AsyncStorage.getItem("token");
      console.log("🔐 Token found:", stored ? "Yes" : "No");
      if (stored) {
        const decode = jwtDecode<DecodedTokenProps>(stored);
        console.log("🔐 Token decoded, exp:", decode.exp, "now:", Date.now() / 1000);
        if (decode.exp && decode.exp < Date.now() / 1000) {
          console.log("🔐 Token expired, removing...");
          await AsyncStorage.removeItem("token");
        } else {
          console.log("🔐 Token valid, setting user:", decode.user);
          setTokden(stored);
          setUser(decode.user);
        }
      }
    } catch (error: any) {
      console.log("🔐 Token load/decode error:", error);
      await AsyncStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
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
    console.log("🔐 [signIn] Attempting login for:", email);
    try {
      const response = await login(email, password);
      console.log("🔐 [signIn] Login successful, saving token...");
      await updateToken(response.token);
      console.log("🔐 [signIn] Token saved, navigating home");
      Toast.success("Welcome back! 👋", "Signed in");
      router.replace("/(tabs)");
    } catch (error: any) {
      console.log("🔐 [signIn] Failed:", error?.message);
      Toast.error(error?.message || "Unable to sign in. Please try again.", "Login failed");
      throw error;
    }
  };
  const signUp = async (email: string, name: string, password: string) => {
    console.log("🔐 [signUp] Registering account for:", email);
    try {
      await register(email, name, password);
      console.log("🔐 [signUp] Registration successful");
      Toast.success("Account created. Please sign in.", "Welcome to Chattrix");
      router.push("/(auth)/login_screen");
    } catch (error: any) {
      console.log("🔐 [signUp] Failed:", error?.message);
      Toast.error(error?.message || "Unable to create account. Please try again.", "Sign up failed");
      throw error;
    }
  };
  const signOut = async () => {
    console.log("🔐 [signOut] Signing out...");
    setTokden(null);
    setUser(null);
    await AsyncStorage.removeItem("token");
    console.log("🔐 [signOut] Token removed, navigating to welcome");
    Toast.info("You have been signed out.", "Signed out");
    router.replace("/(auth)/welcome_screen");
  };
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated, isLoading, signUp, signIn, signOut, updateToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
