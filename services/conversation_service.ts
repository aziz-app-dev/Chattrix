import { CONVERSATIONS_URL, USERS_URL } from "@/constants/urls";
import axios from "axios";

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

const getApiErrorMessage = (error: any, fallback: string): string => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.response) {
    return `Request failed (${error.response.status}).`;
  }
  if (error?.request) {
    return "Cannot reach the server. Please check your connection and try again.";
  }
  return error?.message || fallback;
};

// Get all conversations (optionally filtered by type)
export const getConversations = async (
  token: string,
  type?: "direct" | "group"
) => {
  try {
    const url = type ? `${CONVERSATIONS_URL}?type=${type}` : CONVERSATIONS_URL;
    const response = await axios.get(url, {
      headers: getAuthHeaders(token),
    });
    return response.data.data;
  } catch (error: any) {
    console.log("Get conversations error:", error);
    throw new Error(getApiErrorMessage(error, "Failed to fetch conversations"));
  }
};

// Create a direct conversation
export const createDirectConversation = async (
  token: string,
  recipientId: string
) => {
  try {
    const response = await axios.post(
      `${CONVERSATIONS_URL}/direct`,
      { recipientId },
      { headers: getAuthHeaders(token) }
    );
    return response.data.data;
  } catch (error: any) {
    console.log("Create direct conversation error:", error);
    throw new Error(
      getApiErrorMessage(error, "Failed to create conversation")
    );
  }
};

// Create a group conversation
export const createGroupConversation = async (
  token: string,
  name: string,
  participantIds: string[],
  avatar?: string
) => {
  try {
    const response = await axios.post(
      `${CONVERSATIONS_URL}/group`,
      { name, participantIds, avatar },
      { headers: getAuthHeaders(token) }
    );
    return response.data.data;
  } catch (error: any) {
    console.log("Create group conversation error:", error);
    throw new Error(getApiErrorMessage(error, "Failed to create group"));
  }
};

// Get messages for a conversation
export const getMessages = async (
  token: string,
  conversationId: string,
  page: number = 1,
  limit: number = 50
) => {
  try {
    const response = await axios.get(
      `${CONVERSATIONS_URL}/${conversationId}/messages?page=${page}&limit=${limit}`,
      { headers: getAuthHeaders(token) }
    );
    return response.data.data;
  } catch (error: any) {
    console.log("Get messages error:", error);
    throw new Error(getApiErrorMessage(error, "Failed to fetch messages"));
  }
};

// Send a message
export const sendMessage = async (
  token: string,
  conversationId: string,
  content: string,
  type: "text" | "image" | "file" = "text",
  attachment?: string
) => {
  try {
    const response = await axios.post(
      `${CONVERSATIONS_URL}/${conversationId}/messages`,
      { content, type, attachment },
      { headers: getAuthHeaders(token) }
    );
    return response.data.data;
  } catch (error: any) {
    console.log("Send message error:", error);
    throw new Error(getApiErrorMessage(error, "Failed to send message"));
  }
};

// Get all users for starting new conversations
export const getUsers = async (token: string, search?: string) => {
  try {
    const url = search ? `${USERS_URL}?search=${search}` : USERS_URL;
    const response = await axios.get(url, {
      headers: getAuthHeaders(token),
    });
    return response.data.data;
  } catch (error: any) {
    console.log("Get users error:", error);
    throw new Error(getApiErrorMessage(error, "Failed to fetch users"));
  }
};
