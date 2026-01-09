import { LOGIN_URL, REGISTER_URL } from "@/constants/urls";
import axios from "axios";

export const login = async (
  email: string,
  password: string
): Promise<{ token: string }> => {
  try {
    const response = await axios.post(LOGIN_URL, {
      email,
      password,
    });
    console.log("🔐 Login API response:", response.data);
    // Backend returns: { success, message, data: { token, ... } }
    return response.data.data;
  } catch (error: any) {
    console.log("Login Error", error);
    const msg = error?.response?.data?.message || "Login failed";
    throw new Error(msg);
  }
};

export const register = async (
  email: string,
  name: string,
  password: string,
  img?: string | null
): Promise<{ token: string }> => {
  try {
    const response = await axios.post(REGISTER_URL, {
      email,
      name,
      password,
      img,
    });
    console.log("🔐 Register API response:", response.data);
    // Backend returns: { success, message, data: { token, ... } }
    return response.data.data;
  } catch (error: any) {
    console.log("Register Error", error);
    const msg = error?.response?.data?.message || "Register failed";
    throw new Error(msg);
  }
};
