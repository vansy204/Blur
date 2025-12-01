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
      console.log(
        '✅ Peer connection already exists and is active, reusing it'
      );
      return this.peerConnection;
    }

    // Clean up existing closed connection
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    console.log('🆕 Creating new peer connection');

    // ✅ FIX: Don't reset pending ICE candidates here!
    // They may have arrived before the peer connection was created
    // and we need to process them after setting remote description
    // this.pendingIceCandidates = []; // REMOVED - causes candidates to be lost!

    this.peerConnection = new RTCPeerConnection(this.configuration);

    // Add local tracks
    if (this.localStream) {
      const tracks = this.localStream.getTracks();
      console.log(`📹 Adding ${tracks.length} local tracks to peer connection`);
      tracks.forEach((track, index) => {
        console.log(`  - Track ${index + 1}: ${track.kind} (enabled: ${track.enabled})`);
        this.peerConnection.addTrack(track, this.localStream);
      });
    } else {
      console.warn('⚠️ No local stream available to add tracks');
    }

    // ICE candidate handler
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 ICE candidate generated:', event.candidate);
        onIceCandidate(event.candidate);
      } else {
        console.log('🏁 ICE candidate gathering completed (no more candidates)');
      }
    };

    // Remote track handler
    this.peerConnection.ontrack = (event) => {
      console.log('🎬 Remote track received:', event.track.kind);
      if (event.streams && event.streams[0]) {
        console.log('📡 Remote stream received');
        this.remoteStream = event.streams[0];
        onTrack(event.streams[0]);
      }
    };

    // Connection state handler - Fixed to properly detect when connected
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log('🔌 WebRTC connectionState changed:', state);

      if (onConnectionStateChange) {
        onConnectionStateChange(state);
      }

      if (state === 'failed') {
        console.log('❌ Connection failed, restarting ICE...');
        this.peerConnection.restartIce();
      }
    };

    // ICE connection state handler - Also monitor ICE state
    this.peerConnection.oniceconnectionstatechange = () => {
      const iceState = this.peerConnection.iceConnectionState;
      const connState = this.peerConnection.connectionState;
      console.log(
        '❄️  ICE connectionState:',
        iceState,
        '| WebRTC connectionState:',
        connState
      );
      // If ICE is connected but connectionState hasn't updated, manually trigger
      if (iceState === 'connected' || iceState === 'completed') {
        if (connState !== 'connected') {
          // Force update connection state
          console.log(
            '⚡ ICE connected but WebRTC not updated, forcing state update...'
          );
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
      console.log('📝 Creating WebRTC offer...');
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      console.log('✅ Offer created, setting as local description...');
      await this.peerConnection.setLocalDescription(offer);
      console.log('✅ Local description set');
      return offer;
    } catch (error) {
      console.error('❌ Error creating offer:', error);
      throw error;
    }
  }

  async createAnswer(offer) {
    try {
      console.log('📝 Creating WebRTC answer...');
      // Use offer directly without RTCSessionDescription (modern browsers)
      await this.peerConnection.setRemoteDescription(offer);
      console.log('✅ Remote offer description set');

      // Process pending ICE candidates after remote description is set
      console.log(`📍 Processing ${this.pendingIceCandidates.length} pending ICE candidates...`);
      for (const candidate of this.pendingIceCandidates) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          // Error adding pending ICE candidate
        }
      }
      this.pendingIceCandidates = [];

      const answer = await this.peerConnection.createAnswer();
      console.log('✅ Answer created, setting as local description...');
      await this.peerConnection.setLocalDescription(answer);
      console.log('✅ Local description set for answer');

      return answer;
    } catch (error) {
      console.error('❌ Error creating answer:', error);
      throw error;
    }
  }

  async setRemoteAnswer(answer) {
    try {
      console.log('📝 Setting remote answer description...');
      // Use answer directly without RTCSessionDescription (modern browsers)
      await this.peerConnection.setRemoteDescription(answer);
      console.log('✅ Remote answer description set');

      // Process pending ICE candidates after remote answer is set
      console.log(`📍 Processing ${this.pendingIceCandidates.length} pending ICE candidates...`);
      for (const candidate of this.pendingIceCandidates) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          // Error adding pending ICE candidate
        }
      }
      this.pendingIceCandidates = [];

    } catch (error) {
      console.error('❌ Error setting remote answer:', error);
      throw error;
    }
  }

  async addIceCandidate(candidate) {
    try {
      // ✅ FIX: Queue ICE candidates if peer connection doesn't exist yet
      // This handles the case where ICE candidates arrive before peer connection is created
      if (!this.peerConnection) {
        console.log(
          '📋 Queuing ICE candidate (peer connection not created yet)'
        );
        this.pendingIceCandidates.push(candidate);
        return;
      }

      // Queue if remote description not set yet
      if (!this.peerConnection.remoteDescription) {
        console.log(
          '📋 Queuing ICE candidate (remote description not set yet)'
        );
        this.pendingIceCandidates.push(candidate);
        return;
      }

      console.log('✅ Adding ICE candidate to peer connection');
      await this.peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    } catch (error) {
      console.warn('⚠️ Error adding ICE candidate (non-fatal):', error.message);
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