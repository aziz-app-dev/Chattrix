// WebRTC Configuration for Audio/Video Calls

export const WEBRTC_CONFIG: RTCConfiguration = {
  iceServers: [
    // Google's free public STUN servers
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

export const MEDIA_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    facingMode: "user",
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
};

// Call timeout in milliseconds (60 seconds)
export const CALL_TIMEOUT_MS = 60000;

// ICE gathering timeout in milliseconds (10 seconds)
export const ICE_GATHERING_TIMEOUT_MS = 10000;
