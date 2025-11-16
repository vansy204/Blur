// src/services/WebRTCService.js
class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.pendingIceCandidates = [];
    
    this.configuration = {
      iceServers: [
        { 
          urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302'
          ]
        }
      ],
      iceCandidatePoolSize: 10
    };
  }

  async initializeMedia(isVideo = false) {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        },
        video: isVideo ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user'
        } : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
      
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera/microphone permission denied. Please allow access in browser settings.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera/microphone found on this device.');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Camera/microphone is already in use by another application.');
      } else {
        throw new Error(`Media error: ${error.message}`);
      }
    }
  }

  createPeerConnection(onIceCandidate, onTrack, onConnectionStateChange) {
    // Clean up existing connection first
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    // Reset pending ICE candidates
    this.pendingIceCandidates = [];

    this.peerConnection = new RTCPeerConnection(this.configuration);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // ICE candidate handler
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    // Remote track handler
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        onTrack(event.streams[0]);
      }
    };

    // Connection state handler
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      
      if (onConnectionStateChange) {
        onConnectionStateChange(state);
      }
      
      if (state === 'failed') {
        this.peerConnection.restartIce();
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      // ICE connection state changed
    };

    this.peerConnection.onicegatheringstatechange = () => {
      // ICE gathering state changed
    };

    return this.peerConnection;
  }

  async createOffer() {
    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      throw error;
    }
  }

  async createAnswer(offer) {
    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      
      // Process pending ICE candidates after remote description is set
      for (const candidate of this.pendingIceCandidates) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          // Error adding pending ICE candidate
        }
      }
      this.pendingIceCandidates = [];
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      return answer;
    } catch (error) {
      throw error;
    }
  }

  async setRemoteAnswer(answer) {
    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      
      // Process pending ICE candidates after remote answer is set
      for (const candidate of this.pendingIceCandidates) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          // Error adding pending ICE candidate
        }
      }
      this.pendingIceCandidates = [];
      
    } catch (error) {
      throw error;
    }
  }

  async addIceCandidate(candidate) {
    try {
      // Queue ICE candidates if remote description not set yet
      if (!this.peerConnection) {
        return;
      }

      if (!this.peerConnection.remoteDescription) {
        this.pendingIceCandidates.push(candidate);
        return;
      }

      await this.peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    } catch (error) {
      // Don't throw - ICE candidate errors shouldn't break the call
    }
  }

  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  cleanup() {
    // Clear pending ICE candidates
    this.pendingIceCandidates = [];
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
  }
}

export default new WebRTCService();