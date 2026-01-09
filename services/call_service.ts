import { BASE_URL } from "@/constants/urls";
import axios from "axios";
import { CallProps } from "@/constants/types";

const CALLS_URL = `${BASE_URL}calls`;

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

// Initiate a new call
export const initiateCallAPI = async (
  token: string,
  type: "audio" | "video",
  participantIds: string[],
  conversationId?: string,
  isGroupCall: boolean = false
): Promise<CallProps> => {
  try {
    const response = await axios.post(
      `${CALLS_URL}/initiate`,
      { type, participantIds, conversationId, isGroupCall },
      { headers: getAuthHeaders(token) }
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Initiate call error:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to initiate call"
    );
  }
};

// Get call history
export const getCallHistory = async (
  token: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  data: CallProps[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> => {
  try {
    const response = await axios.get(
      `${CALLS_URL}/history?page=${page}&limit=${limit}`,
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  } catch (error: any) {
    console.error("Get call history error:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to fetch call history"
    );
  }
};

// Get call details
export const getCallDetails = async (
  token: string,
  callId: string
): Promise<CallProps> => {
  try {
    const response = await axios.get(`${CALLS_URL}/${callId}`, {
      headers: getAuthHeaders(token),
    });
    return response.data.data;
  } catch (error: any) {
    console.error("Get call details error:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to fetch call details"
    );
  }
};

// Update call status
export const updateCallStatusAPI = async (
  token: string,
  callId: string,
  status: string,
  endReason?: string
): Promise<CallProps> => {
  try {
    const response = await axios.patch(
      `${CALLS_URL}/${callId}/status`,
      { status, endReason },
      { headers: getAuthHeaders(token) }
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Update call status error:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to update call status"
    );
  }
};

// Update participant status
export const updateParticipantStatusAPI = async (
  token: string,
  callId: string,
  participantStatus: string
): Promise<CallProps> => {
  try {
    const response = await axios.patch(
      `${CALLS_URL}/${callId}/participant`,
      { participantStatus },
      { headers: getAuthHeaders(token) }
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Update participant status error:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to update participant status"
    );
  }
};
