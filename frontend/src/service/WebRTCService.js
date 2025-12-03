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
    // ✅ FIX: Don't destroy existing peer connection if it's already being used
    // Only create a new one if we don't have one or if the current one is closed
    if (
      this.peerConnection &&
      this.peerConnection.connectionState !== 'closed'
    ) {
      return this.peerConnection;
    }

    // Clean up existing closed connection
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    // ✅ FIX: Don't reset pending ICE candidates here!
    // They may have arrived before the peer connection was created
    // and we need to process them after setting remote description
    // this.pendingIceCandidates = []; // REMOVED - causes candidates to be lost!

    this.peerConnection = new RTCPeerConnection(this.configuration);

    // Add local tracks
    if (this.localStream) {
      const tracks = this.localStream.getTracks();
      tracks.forEach((track) => {
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

    // ICE connection state handler - Also monitor ICE state
    this.peerConnection.oniceconnectionstatechange = () => {
      const iceState = this.peerConnection.iceConnectionState;
      const connState = this.peerConnection.connectionState;
      // If ICE is connected but connectionState hasn't updated, manually trigger
      if (iceState === 'connected' || iceState === 'completed') {
        if (connState !== 'connected') {
          // Force update connection state
          if (onConnectionStateChange) {
            onConnectionStateChange('connected');
          }
        }
      }
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
      // Use offer directly without RTCSessionDescription (modern browsers)
      await this.peerConnection.setRemoteDescription(offer);

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
      // Use answer directly without RTCSessionDescription (modern browsers)
      await this.peerConnection.setRemoteDescription(answer);

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
      // Queue ICE candidates if peer connection doesn't exist yet
      if (!this.peerConnection) {
        this.pendingIceCandidates.push(candidate);
        return;
      }

      // Queue if remote description not set yet
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