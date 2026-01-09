import MyTxt from "@/components/txt_conponents";
import { colors } from "@/constants/theme";
import { CallProps } from "@/constants/types";
import { useAuth } from "@/context/auth_context";
import { useCall } from "@/context/call_context";
import { getCallHistory } from "@/services/call_service";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const CallHistoryScreen = () => {
  const { token, user } = useAuth();
  const { initiateCall } = useCall();
  const [calls, setCalls] = useState<CallProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCalls = useCallback(
    async (pageNum: number = 1, refresh: boolean = false) => {
      if (!token) return;

      try {
        if (refresh) setRefreshing(true);
        else if (pageNum === 1) setLoading(true);

        const response = await getCallHistory(token, pageNum, 20);

        if (refresh || pageNum === 1) {
          setCalls(response.data);
        } else {
          setCalls((prev) => [...prev, ...response.data]);
        }

        setHasMore(response.pagination.page < response.pagination.pages);
        setPage(pageNum);
      } catch (error) {
        console.error("Error fetching calls:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  // Fetch calls when screen is focused (refreshes after returning from a call)
  useFocusEffect(
    useCallback(() => {
      fetchCalls(1, false);
    }, [fetchCalls])
  );

  const onRefresh = () => fetchCalls(1, true);

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchCalls(page + 1);
    }
  };

  const formatCallDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "No answer";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCallStatusText = (call: CallProps): string => {
    const isOutgoing = call.initiator._id === user?.id;

    switch (call.status) {
      case "missed":
        return "Missed";
      case "declined":
        return isOutgoing ? "Declined" : "Declined";
      case "ended":
        return formatDuration(call.duration);
      case "failed":
        return "Failed";
      default:
        return call.status;
    }
  };

  const getCallIcon = (call: CallProps) => {
    const isOutgoing = call.initiator._id === user?.id;
    const isMissed = call.status === "missed" || call.status === "declined";

    let iconName: "call" | "call-outline" = isOutgoing ? "call-outline" : "call";
    let iconColor = isOutgoing ? colors.primary : colors.green;

    if (isMissed) {
      iconColor = colors.rose;
    }

    return (
      <View style={[styles.callIconContainer, { backgroundColor: iconColor + "20" }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
        {isOutgoing && (
          <Ionicons
            name="arrow-up"
            size={10}
            color={iconColor}
            style={styles.directionIcon}
          />
        )}
        {!isOutgoing && (
          <Ionicons
            name="arrow-down"
            size={10}
            color={iconColor}
            style={styles.directionIcon}
          />
        )}
      </View>
    );
  };

  const handleCallFromHistory = (item: CallProps, callType: "audio" | "video") => {
    const isOutgoing = item.initiator._id === user?.id;

    // Get participant IDs to call (exclude current user)
    const participantIds = item.participants
      .map((p) => p.user._id)
      .filter((id) => id !== user?.id);

    // If current user was the initiator, we already have other participants
    // If not, add the initiator to the call
    if (!isOutgoing && !participantIds.includes(item.initiator._id)) {
      participantIds.push(item.initiator._id);
    }

    if (participantIds.length > 0) {
      initiateCall(participantIds, callType);
    }
  };

  const renderCall = ({ item }: { item: CallProps }) => {
    const isOutgoing = item.initiator._id === user?.id;
    const otherParticipant = item.participants.find(
      (p) => p.user._id !== user?.id
    );
    const displayName = isOutgoing
      ? otherParticipant?.user.name || "Unknown"
      : item.initiator.name;
    const displayImg = isOutgoing
      ? otherParticipant?.user.img
      : item.initiator.img;

    return (
      <View style={styles.callItem}>
        <Image
          source={
            displayImg
              ? { uri: displayImg }
              : require("@/assets/images/3d_profile.png")
          }
          style={styles.avatar}
        />

        <View style={styles.callInfo}>
          <MyTxt fontSize={16} fontWeight="500">
            {displayName}
            {item.isGroupCall && ` (+${item.participants.length - 2})`}
          </MyTxt>
          <View style={styles.callDetails}>
            {getCallIcon(item)}
            <Ionicons
              name={item.type === "video" ? "videocam" : "call"}
              size={14}
              color={colors.neutral400}
              style={{ marginLeft: 6 }}
            />
            <MyTxt fontSize={13} color={colors.neutral400} style={{ marginLeft: 4 }}>
              {getCallStatusText(item)}
            </MyTxt>
          </View>
        </View>

        <View style={styles.callActions}>
          <MyTxt fontSize={12} color={colors.neutral400} style={{ marginBottom: 6 }}>
            {formatCallDate(item.createdAt)}
          </MyTxt>
          <View style={styles.callButtons}>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => handleCallFromHistory(item, "audio")}
            >
              <Ionicons name="call" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => handleCallFromHistory(item, "video")}
            >
              <Ionicons name="videocam" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading && calls.length === 0) {
    return (
      <ImageBackground
        style={styles.container}
        source={require("@/assets/images/bgPattern.png")}
      >
        <View style={styles.header}>
          <MyTxt color={colors.white} fontSize={24} fontWeight="700">
            Calls
          </MyTxt>
        </View>
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      style={styles.container}
      source={require("@/assets/images/bgPattern.png")}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <MyTxt color={colors.white} fontSize={24} fontWeight="700">
          Calls
        </MyTxt>
        <View style={styles.headerIcon}>
          <Ionicons name="call" size={18} color={colors.white} />
        </View>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        <FlatList
          data={calls}
          keyExtractor={(item) => item._id}
          renderItem={renderCall}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="call-outline" size={50} color={colors.neutral400} />
              </View>
              <MyTxt fontSize={18} fontWeight="600" style={{ marginTop: 16 }}>
                No calls yet
              </MyTxt>
              <MyTxt
                fontSize={14}
                color={colors.neutral400}
                style={{ marginTop: 8, textAlign: "center" }}
              >
                Start a call from any chat to see your call history here
              </MyTxt>
            </View>
          }
        />
      </View>
    </ImageBackground>
  );
};

export default CallHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerIcon: {
    padding: 10,
    backgroundColor: colors.neutral700,
    borderRadius: 100,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  callItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.neutral200,
  },
  callInfo: {
    flex: 1,
    marginLeft: 12,
  },
  callDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  callIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  directionIcon: {
    marginLeft: 2,
  },
  callActions: {
    alignItems: "flex-end",
  },
  callButtons: {
    flexDirection: "row",
    gap: 8,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.neutral100,
    justifyContent: "center",
    alignItems: "center",
  },
});
