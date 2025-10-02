// Simplified WebRTC service for video consultations
class SimpleWebRTCService {
    constructor() {
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.socket = null;
        this.roomId = null;
        this.participantId = null;
        this.isInitiator = false;
        this.isAudioEnabled = true;
        this.isVideoEnabled = true;
        this.onRemoteStreamCallback = null;
        this.onParticipantJoinedCallback = null;
        this.onParticipantLeftCallback = null;
        this.onConnectionStateChangeCallback = null;

        // Simplified WebRTC configuration
        this.pcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
    }

    // Initialize service
    async initialize(roomId, participantId) {
        try {
            this.roomId = roomId;
            this.participantId = participantId;

            // Initialize socket connection to existing Socket.IO endpoint
            if (typeof window !== 'undefined' && window.io) {
                // Connect to existing Socket.IO server
                const response = await fetch('/api/socket');
                if (response.ok) {
                    console.log('Socket.IO server is available');
                    // Initialize socket connection
                    this.socket = window.io();
                    this.setupSocketListeners();
                }
            }

            // Get user media
            await this.getUserMedia();
            console.log('Simple WebRTC service initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize service:', error);
            throw error;
        }
    }

    // Setup socket listeners
    setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('participant-joined', (data) => {
            console.log('Participant joined:', data);
            if (this.onParticipantJoinedCallback) {
                this.onParticipantJoinedCallback(data);
            }
        });

        this.socket.on('participant-left', (data) => {
            console.log('Participant left:', data);
            if (this.onParticipantLeftCallback) {
                this.onParticipantLeftCallback(data);
            }
        });

        this.socket.on('video-offer', async (data) => {
            console.log('Received video offer');
            if (!this.peerConnection) {
                this.createPeerConnection();
            }

            try {
                await this.peerConnection.setRemoteDescription(data.offer);
                const answer = await this.peerConnection.createAnswer();
                await this.peerConnection.setLocalDescription(answer);

                this.socket.emit('video-answer', {
                    roomId: this.roomId,
                    answer: answer,
                    participantId: this.participantId
                });
            } catch (error) {
                console.error('Failed to handle offer:', error);
            }
        });

        this.socket.on('video-answer', async (data) => {
            console.log('Received video answer');
            if (this.peerConnection) {
                try {
                    await this.peerConnection.setRemoteDescription(data.answer);
                } catch (error) {
                    console.error('Failed to handle answer:', error);
                }
            }
        });

        this.socket.on('ice-candidate', async (data) => {
            console.log('Received ICE candidate');
            if (this.peerConnection) {
                try {
                    await this.peerConnection.addIceCandidate(data.candidate);
                } catch (error) {
                    console.error('Failed to add ICE candidate:', error);
                }
            }
        });
    }

    // Get user media
    async getUserMedia(constraints = { video: true, audio: true }) {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.isVideoEnabled = constraints.video;
            this.isAudioEnabled = constraints.audio;
            console.log('Got user media successfully');
            return this.localStream;
        } catch (error) {
            console.error('Failed to get user media:', error);
            // Try audio only as fallback
            try {
                this.localStream = await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: true
                });
                this.isVideoEnabled = false;
                this.isAudioEnabled = true;
                console.log('Got audio-only media as fallback');
                return this.localStream;
            } catch (audioError) {
                console.error('Failed to get audio:', audioError);
                throw audioError;
            }
        }
    }

    // Create peer connection (simplified)
    createPeerConnection() {
        try {
            this.peerConnection = new RTCPeerConnection(this.pcConfig);

            // Add local stream tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, this.localStream);
                });
            }

            // Handle remote stream
            this.peerConnection.ontrack = (event) => {
                console.log('Received remote stream');
                this.remoteStream = event.streams[0];
                if (this.onRemoteStreamCallback) {
                    this.onRemoteStreamCallback(this.remoteStream);
                }
            };

            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate && this.socket) {
                    this.socket.emit('ice-candidate', {
                        roomId: this.roomId,
                        candidate: event.candidate,
                        participantId: this.participantId
                    });
                }
            };

            // Handle connection state changes
            this.peerConnection.onconnectionstatechange = () => {
                console.log('Connection state:', this.peerConnection.connectionState);
                if (this.onConnectionStateChangeCallback) {
                    this.onConnectionStateChangeCallback(this.peerConnection.connectionState);
                }
            };

            console.log('Peer connection created successfully');
            return this.peerConnection;
        } catch (error) {
            console.error('Failed to create peer connection:', error);
            throw error;
        }
    }

    // Join room 
    async joinRoom(consultationId) {
        try {
            console.log('Joining consultation room:', this.roomId);

            // Create peer connection
            this.createPeerConnection();

            // Join video room via socket
            if (this.socket) {
                this.socket.emit('join-video-room', {
                    roomId: this.roomId,
                    participantId: this.participantId
                });
            }

            return true;
        } catch (error) {
            console.error('Failed to join room:', error);
            throw error;
        }
    }

    // Create and send offer
    async createOffer() {
        try {
            if (!this.peerConnection) {
                this.createPeerConnection();
            }

            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            if (this.socket) {
                this.socket.emit('video-offer', {
                    roomId: this.roomId,
                    offer: offer,
                    participantId: this.participantId
                });
            }

            console.log('Offer created and sent');
        } catch (error) {
            console.error('Failed to create offer:', error);
            throw error;
        }
    }

    // Toggle audio
    toggleAudio() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                this.isAudioEnabled = audioTrack.enabled;
                console.log('Audio toggled:', this.isAudioEnabled);
                return this.isAudioEnabled;
            }
        }
        return false;
    }

    // Toggle video
    toggleVideo() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                this.isVideoEnabled = videoTrack.enabled;
                console.log('Video toggled:', this.isVideoEnabled);
                return this.isVideoEnabled;
            }
        }
        return false;
    }

    // Screen sharing (simplified)
    async startScreenShare() {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            console.log('Screen sharing started');
            return screenStream;
        } catch (error) {
            console.error('Failed to start screen sharing:', error);
            throw error;
        }
    }

    // Stop screen sharing
    async stopScreenShare() {
        console.log('Screen sharing stopped');
    }

    // Send chat message (demo)
    sendChatMessage(message) {
        console.log('Sending chat message:', message);
    }

    // Leave room and cleanup
    async leaveRoom() {
        try {
            // Leave video room via socket
            if (this.socket) {
                this.socket.emit('leave-video-room', {
                    roomId: this.roomId,
                    participantId: this.participantId
                });
            }

            // Close peer connection
            if (this.peerConnection) {
                this.peerConnection.close();
                this.peerConnection = null;
            }

            // Stop local stream
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = null;
            }

            // Disconnect socket
            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
            }

            console.log('Left room and cleaned up resources');
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    }

    // Set callback functions
    onRemoteStream(callback) {
        this.onRemoteStreamCallback = callback;
    }

    onParticipantJoined(callback) {
        this.onParticipantJoinedCallback = callback;
    }

    onParticipantLeft(callback) {
        this.onParticipantLeftCallback = callback;
    }

    onConnectionStateChange(callback) {
        this.onConnectionStateChangeCallback = callback;
    }

    // Get current state
    getState() {
        return {
            isConnected: this.peerConnection?.connectionState === 'connected',
            isAudioEnabled: this.isAudioEnabled,
            isVideoEnabled: this.isVideoEnabled,
            hasLocalStream: !!this.localStream,
            hasRemoteStream: !!this.remoteStream,
            roomId: this.roomId,
            participantId: this.participantId
        };
    }
}

// Export for use in components
if (typeof window !== 'undefined') {
    window.SimpleWebRTCService = SimpleWebRTCService;
}

export default SimpleWebRTCService;