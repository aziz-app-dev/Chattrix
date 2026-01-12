import { WEBRTC_CONFIG, MEDIA_CONSTRAINTS } from "@/constants/webrtc_config";

// Conditionally import WebRTC - it requires a development build
let RTCPeerConnection: any = null;
let RTCSessionDescription: any = null;
let RTCIceCandidate: any = null;
let mediaDevices: any = null;
let isWebRTCAvailable = false;

try {
  const webrtc = require("react-native-webrtc");
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  RTCIceCandidate = webrtc.RTCIceCandidate;
  mediaDevices = webrtc.mediaDevices;
  isWebRTCAvailable = true;
} catch (e) {
  console.warn("react-native-webrtc not available - requires development build");
}

export interface PeerConnectionData {
  peerId: string;
  connection: any;
  remoteStream: any;
  iceCandidatesQueue: RTCIceCandidateInit[];
}

class WebRTCService {
  private peerConnections: Map<string, PeerConnectionData> = new Map();
  private localStream: any = null;

  isAvailable(): boolean {
    return isWebRTCAvailable;
  }

  // Get local media stream
  async getLocalStream(isVideoCall: boolean): Promise<any> {
    if (!isWebRTCAvailable) {
      throw new Error("WebRTC is not available - requires development build");
    }

    try {
      const constraints: any = {
        audio: MEDIA_CONSTRAINTS.audio,
        video: isVideoCall ? MEDIA_CONSTRAINTS.video : false,
      };

      this.localStream = await mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      console.error("Error getting local stream:", error);
      throw error;
    }
  }

  // Create peer connection for a specific peer
  createPeerConnection(
    peerId: string,
    onIceCandidate: (candidate: RTCIceCandidateInit) => void,
    onTrack: (stream: any) => void,
    onConnectionStateChange: (state: string) => void
  ): any {
    if (!isWebRTCAvailable) {
      throw new Error("WebRTC is not available - requires development build");
    }

    const pc = new RTCPeerConnection(WEBRTC_CONFIG);

    // Add local tracks to connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        onIceCandidate(event.candidate.toJSON());
      }
    };

    // Handle remote tracks
    pc.ontrack = (event: any) => {
      const remoteStream = event.streams[0];
      if (remoteStream) {
        onTrack(remoteStream);
        const peerData = this.peerConnections.get(peerId);
        if (peerData) {
          peerData.remoteStream = remoteStream;
        }
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      onConnectionStateChange(pc.connectionState);
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${peerId}:`, pc.iceConnectionState);
    };

    // Store peer connection
    this.peerConnections.set(peerId, {
      peerId,
      connection: pc,
      remoteStream: null,
      iceCandidatesQueue: [],
    });

    return pc;
  }

  // Create and send offer
  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const peerData = this.peerConnections.get(peerId);
    if (!peerData) {
      throw new Error(`No peer connection for ${peerId}`);
    }

    const offer = await peerData.connection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await peerData.connection.setLocalDescription(offer);

    return offer;
  }

  // Handle received offer and create answer
  async handleOffer(
    peerId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    if (!isWebRTCAvailable) {
      throw new Error("WebRTC is not available");
    }

    const peerData = this.peerConnections.get(peerId);
    if (!peerData) {
      throw new Error(`No peer connection for ${peerId}`);
    }

    const pc = peerData.connection;
    const currentState = pc.signalingState;
    console.log(`handleOffer called, current signaling state: ${currentState}`);

    // If already stable, negotiation is complete - skip
    if (currentState === "stable" && pc.remoteDescription) {
      console.warn("Connection already stable with remote description, skipping duplicate offer");
      return { type: "answer", sdp: pc.localDescription?.sdp || "" };
    }

    // Handle different signaling states
    if (currentState === "have-remote-offer") {
      // Already have a remote offer, just create answer if we haven't yet
      console.warn("Already have remote offer, creating answer");
      try {
        const answer = await pc.createAnswer();
        if (pc.signalingState === "have-remote-offer") {
          await pc.setLocalDescription(answer);
        }
        await this.processIceCandidateQueue(peerId);
        return answer;
      } catch (err) {
        console.warn("Error creating answer in have-remote-offer state:", err);
        return { type: "answer", sdp: pc.localDescription?.sdp || "" };
      }
    }

    if (currentState === "have-local-offer") {
      // Glare condition: both sides sent offers
      // Roll back our local offer and accept the remote one
      console.log("Glare detected, rolling back local offer");
      try {
        await pc.setLocalDescription({ type: "rollback" });
      } catch (err) {
        console.warn("Error rolling back:", err);
      }
    } else if (currentState !== "stable") {
      console.warn(`Unexpected signaling state: ${currentState}, skipping offer`);
      throw new Error(`Cannot handle offer in state: ${currentState}`);
    }

    // Now should be in stable state, set remote description
    if (pc.signalingState !== "stable") {
      console.warn(`Expected stable state but got ${pc.signalingState}`);
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();

    // Check state before setting local description
    if (pc.signalingState === "have-remote-offer") {
      await pc.setLocalDescription(answer);
    } else {
      console.warn(`Skipping setLocalDescription, state is ${pc.signalingState}`);
    }

    // Process queued ICE candidates
    await this.processIceCandidateQueue(peerId);

    return answer;
  }

  // Handle received answer
  async handleAnswer(
    peerId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    if (!isWebRTCAvailable) {
      throw new Error("WebRTC is not available");
    }

    const peerData = this.peerConnections.get(peerId);
    if (!peerData) {
      throw new Error(`No peer connection for ${peerId}`);
    }

    const pc = peerData.connection;

    // Only set remote description if we're expecting an answer
    if (pc.signalingState !== "have-local-offer") {
      console.warn(`Cannot set answer in state: ${pc.signalingState}`);
      return;
    }

    await pc.setRemoteDescription(new RTCSessionDescription(answer));

    // Process queued ICE candidates
    await this.processIceCandidateQueue(peerId);
  }

  // Handle received ICE candidate
  async handleIceCandidate(
    peerId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    if (!isWebRTCAvailable) return;

    const peerData = this.peerConnections.get(peerId);
    if (!peerData) {
      console.warn(`No peer connection for ${peerId}, ignoring ICE candidate`);
      return;
    }

    // If remote description is not set yet, queue the candidate
    if (!peerData.connection.remoteDescription) {
      peerData.iceCandidatesQueue.push(candidate);
      return;
    }

    try {
      await peerData.connection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  }

  // Process queued ICE candidates
  private async processIceCandidateQueue(peerId: string): Promise<void> {
    if (!isWebRTCAvailable) return;

    const peerData = this.peerConnections.get(peerId);
    if (!peerData) return;

    while (peerData.iceCandidatesQueue.length > 0) {
      const candidate = peerData.iceCandidatesQueue.shift();
      if (candidate) {
        try {
          await peerData.connection.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (error) {
          console.error("Error processing queued ICE candidate:", error);
        }
      }
    }
  }

  // Toggle audio track
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track: any) => {
        track.enabled = enabled;
      });
    }
  }

  // Toggle video track
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track: any) => {
        track.enabled = enabled;
      });
    }
  }

  // Switch camera (front/back)
  async switchCamera(): Promise<void> {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack && videoTrack._switchCamera) {
        await videoTrack._switchCamera();
      }
    }
  }

  // Get remote stream for a peer
  getRemoteStream(peerId: string): any {
    return this.peerConnections.get(peerId)?.remoteStream || null;
  }

  // Close specific peer connection
  closePeerConnection(peerId: string): void {
    const peerData = this.peerConnections.get(peerId);
    if (peerData) {
      peerData.connection.close();
      this.peerConnections.delete(peerId);
    }
  }

  // Clean up all connections and streams
  cleanup(): void {
    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => track.stop());
      this.localStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach((peerData) => {
      peerData.connection.close();
    });
    this.peerConnections.clear();
  }

  // Get all peer connections
  getAllPeerConnections(): Map<string, PeerConnectionData> {
    return this.peerConnections;
  }

  // Get local stream
  getLocalStreamInstance(): any {
    return this.localStream;
  }

  // Check if peer connection exists
  hasPeerConnection(peerId: string): boolean {
    return this.peerConnections.has(peerId);
  }
}

export const webrtcService = new WebRTCService();
