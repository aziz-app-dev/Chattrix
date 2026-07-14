import { LOGIN_URL, REGISTER_URL } from "@/constants/urls";
import axios from "axios";

/**
 * Turn an axios error into a clear, user-facing message.
 * - Server responded with an error status -> use the backend message, or a
 *   sensible status-based fallback (invalid credentials, already exists, ...).
 * - Request sent but no response (server down / network / timeout) -> connection message.
 */
const getApiErrorMessage = (error: any, fallback: string): string => {
  // The server responded with a non-2xx status
  if (error?.response) {
    const data = error.response.data;
    const backendMessage = data?.message || data?.error;
    if (backendMessage) return backendMessage;

    switch (error.response.status) {
      case 400:
        return "Invalid request. Please check your details.";
      case 401:
        return "Invalid email or password.";
      case 403:
        return "You are not allowed to perform this action.";
      case 404:
        return "Account not found.";
      case 409:
        return "An account with this email already exists.";
      case 500:
      case 502:
      case 503:
        return "Server error. Please try again later.";
      default:
        return `Request failed (${error.response.status}).`;
    }
  }

  // The request was made but no response was received (backend down / no network)
  if (error?.request) {
    return "Cannot reach the server. Please check your connection and try again.";
  }

  // Something else went wrong setting up the request
  return error?.message || fallback;
};

export const login = async (
  email: string,
  password: string
): Promise<{ token: string }> => {
  try {
    const response = await axios.post(LOGIN_URL, {
      email,
      password,
    });
    console.log("🔐 [auth] Login API response:", response.data);
    // Backend returns: { success, message, data: { token, ... } }
    return response.data.data;
  } catch (error: any) {
    const msg = getApiErrorMessage(error, "Login failed");
    console.log("🔐 [auth] Login error:", msg, "| status:", error?.response?.status);
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
    console.log("🔐 [auth] Register API response:", response.data);
    // Backend returns: { success, message, data: { token, ... } }
    return response.data.data;
  } catch (error: any) {
    const msg = getApiErrorMessage(error, "Registration failed");
    console.log("🔐 [auth] Register error:", msg, "| status:", error?.response?.status);
    throw new Error(msg);
  }
};
