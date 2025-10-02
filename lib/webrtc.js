// WebRTC service for video consultations
class WebRTCService {
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
        this.dataChannel = null;

        // WebRTC configuration
        this.pcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                // Add TURN servers for production
                // {
                //     urls: 'turn:your-turn-server.com:3478',
                //     username: 'your-username',
                //     credential: 'your-password'
                // }
            ],
            iceCandidatePoolSize: 10
        };
    }

    // Initialize WebRTC service
    async initialize(roomId, participantId, socketUrl = 'http://localhost:3001') {
        try {
            this.roomId = roomId;
            this.participantId = participantId;

            // Initialize socket connection for signaling
            if (typeof window !== 'undefined' && window.io) {
                this.socket = window.io(socketUrl, {
                    transports: ['websocket', 'polling']
                });
                this.setupSocketListeners();
            } else {
                console.warn('Socket.IO not available, using fallback signaling');
                this.setupFallbackSignaling();
            }

            // Get user media
            await this.getUserMedia();

            console.log('WebRTC service initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize WebRTC service:', error);
            throw error;
        }
    }

    // Get user media (camera and microphone)
    async getUserMedia(constraints = { video: true, audio: true }) {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.isVideoEnabled = constraints.video;
            this.isAudioEnabled = constraints.audio;

            console.log('Got user media successfully');
            return this.localStream;
        } catch (error) {
            console.error('Failed to get user media:', error);

            // Try with audio only if video fails
            if (constraints.video) {
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
                    console.error('Failed to get audio media:', audioError);
                }
            }

            throw error;
        }
    }

    // Create peer connection
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

            // Create data channel for text messages
            if (this.isInitiator) {
                this.dataChannel = this.peerConnection.createDataChannel('messages', {
                    ordered: true
                });
                this.setupDataChannel(this.dataChannel);
            } else {
                this.peerConnection.ondatachannel = (event) => {
                    this.dataChannel = event.channel;
                    this.setupDataChannel(this.dataChannel);
                };
            }

            console.log('Peer connection created successfully');
            return this.peerConnection;
        } catch (error) {
            console.error('Failed to create peer connection:', error);
            throw error;
        }
    }

    // Setup data channel for messaging
    setupDataChannel(channel) {
        channel.onopen = () => {
            console.log('Data channel opened');
        };

        channel.onmessage = (event) => {
            console.log('Received data channel message:', event.data);
            try {
                const message = JSON.parse(event.data);
                this.handleDataChannelMessage(message);
            } catch (error) {
                console.error('Failed to parse data channel message:', error);
            }
        };

        channel.onclose = () => {
            console.log('Data channel closed');
        };

        channel.onerror = (error) => {
            console.error('Data channel error:', error);
        };
    }

    // Handle data channel messages
    handleDataChannelMessage(message) {
        switch (message.type) {
            case 'chat':
                console.log('Chat message received:', message.data);
                break;
            case 'participant-update':
                console.log('Participant update:', message.data);
                break;
            default:
                console.log('Unknown data channel message type:', message.type);
        }
    }

    // Join video consultation room
    async joinRoom(consultationId) {
        try {
            if (!this.socket) {
                throw new Error('Socket connection not established');
            }

            // Join the room
            this.socket.emit('join-room', {
                roomId: this.roomId,
                participantId: this.participantId,
                consultationId: consultationId
            });

            console.log('Joining room:', this.roomId);
            return true;
        } catch (error) {
            console.error('Failed to join room:', error);
            throw error;
        }
    }

    // Setup socket listeners for signaling
    setupSocketListeners() {
        this.socket.on('participant-joined', (data) => {
            console.log('Participant joined:', data);
            if (data.participantId !== this.participantId) {
                this.isInitiator = true;
                this.createPeerConnection();
                this.createOffer();
                if (this.onParticipantJoinedCallback) {
                    this.onParticipantJoinedCallback(data);
                }
            }
        });

        this.socket.on('participant-left', (data) => {
            console.log('Participant left:', data);
            if (this.onParticipantLeftCallback) {
                this.onParticipantLeftCallback(data);
            }
        });

        this.socket.on('offer', async (data) => {
            console.log('Received offer');
            if (!this.peerConnection) {
                this.createPeerConnection();
            }

            try {
                await this.peerConnection.setRemoteDescription(data.offer);
                const answer = await this.peerConnection.createAnswer();
                await this.peerConnection.setLocalDescription(answer);

                this.socket.emit('answer', {
                    roomId: this.roomId,
                    answer: answer,
                    participantId: this.participantId
                });
            } catch (error) {
                console.error('Failed to handle offer:', error);
            }
        });

        this.socket.on('answer', async (data) => {
            console.log('Received answer');
            try {
                await this.peerConnection.setRemoteDescription(data.answer);
            } catch (error) {
                console.error('Failed to handle answer:', error);
            }
        });

        this.socket.on('ice-candidate', async (data) => {
            console.log('Received ICE candidate');
            try {
                await this.peerConnection.addIceCandidate(data.candidate);
            } catch (error) {
                console.error('Failed to add ICE candidate:', error);
            }
        });

        this.socket.on('room-full', () => {
            console.error('Room is full');
            alert('The consultation room is full. Please try again later.');
        });

        this.socket.on('room-error', (error) => {
            console.error('Room error:', error);
        });
    }

    // Setup fallback signaling (for demo purposes)
    setupFallbackSignaling() {
        console.log('Using fallback signaling mechanism');
        // This would typically use HTTP polling or other fallback methods
        // For demo purposes, we'll just log it
    }

    // Create and send offer
    async createOffer() {
        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            this.socket.emit('offer', {
                roomId: this.roomId,
                offer: offer,
                participantId: this.participantId
            });

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

                // Notify other participants
                this.sendDataChannelMessage({
                    type: 'participant-update',
                    data: { isAudioEnabled: this.isAudioEnabled }
                });

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

                // Notify other participants
                this.sendDataChannelMessage({
                    type: 'participant-update',
                    data: { isVideoEnabled: this.isVideoEnabled }
                });

                return this.isVideoEnabled;
            }
        }
        return false;
    }

    // Send message through data channel
    sendDataChannelMessage(message) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(message));
        }
    }

    // Send chat message
    sendChatMessage(message) {
        this.sendDataChannelMessage({
            type: 'chat',
            data: {
                message: message,
                timestamp: new Date().toISOString(),
                participantId: this.participantId
            }
        });
    }

    // Screen sharing
    async startScreenShare() {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            // Replace video track with screen share
            const videoTrack = screenStream.getVideoTracks()[0];
            const sender = this.peerConnection.getSenders().find(s =>
                s.track && s.track.kind === 'video'
            );

            if (sender) {
                await sender.replaceTrack(videoTrack);
            }

            // Handle screen share end
            videoTrack.onended = () => {
                this.stopScreenShare();
            };

            console.log('Screen sharing started');
            return screenStream;
        } catch (error) {
            console.error('Failed to start screen sharing:', error);
            throw error;
        }
    }

    // Stop screen sharing
    async stopScreenShare() {
        try {
            // Get original video track
            const videoTrack = this.localStream.getVideoTracks()[0];
            const sender = this.peerConnection.getSenders().find(s =>
                s.track && s.track.kind === 'video'
            );

            if (sender && videoTrack) {
                await sender.replaceTrack(videoTrack);
            }

            console.log('Screen sharing stopped');
        } catch (error) {
            console.error('Failed to stop screen sharing:', error);
        }
    }

    // Leave room and cleanup
    async leaveRoom() {
        try {
            // Notify server
            if (this.socket) {
                this.socket.emit('leave-room', {
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

            // Close data channel
            if (this.dataChannel) {
                this.dataChannel.close();
                this.dataChannel = null;
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
    window.WebRTCService = WebRTCService;
}

export default WebRTCService;