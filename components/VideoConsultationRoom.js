'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import SimpleWebRTCService from '@/lib/simple-webrtc';
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    Phone,
    PhoneOff,
    Monitor,
    MessageCircle,
    Users,
    Settings,
    Camera,
    Maximize,
    Minimize
} from 'lucide-react';

export default function VideoConsultationRoom({ consultationId, roomId, onLeave }) {
    const { data: session } = useSession();
    const [webrtcService] = useState(() => new SimpleWebRTCService());
    const [isConnected, setIsConnected] = useState(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [connectionState, setConnectionState] = useState('new');
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [error, setError] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Initialize video consultation
    useEffect(() => {
        const initializeConsultation = async () => {
            try {
                setIsInitializing(true);
                setError(null);

                if (!session?.user?.id || !consultationId || !roomId) {
                    throw new Error('Missing required consultation parameters');
                }

                const participantId = `${session.user.id}_${Date.now()}`;

                // Initialize WebRTC service
                await webrtcService.initialize(roomId, participantId);

                // Setup callbacks
                webrtcService.onRemoteStream((stream) => {
                    console.log('Remote stream received');
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = stream;
                    }
                });

                webrtcService.onParticipantJoined((data) => {
                    console.log('Participant joined:', data);
                    setParticipants(prev => [...prev, data]);
                });

                webrtcService.onParticipantLeft((data) => {
                    console.log('Participant left:', data);
                    setParticipants(prev => prev.filter(p => p.participantId !== data.participantId));
                });

                webrtcService.onConnectionStateChange((state) => {
                    console.log('Connection state changed:', state);
                    setConnectionState(state);
                    setIsConnected(state === 'connected');
                });

                // Get local stream and display it
                const localStream = await webrtcService.getUserMedia();
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = localStream;
                }

                // Join the consultation room
                await webrtcService.joinRoom(consultationId);

                // Join room via API
                const response = await fetch(`/api/video-consultations/${consultationId}/join`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        participantInfo: {
                            isAudioEnabled,
                            isVideoEnabled
                        }
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to join consultation');
                }

                const data = await response.json();
                console.log('Successfully joined consultation:', data);

                setIsInitializing(false);
            } catch (error) {
                console.error('Failed to initialize consultation:', error);
                setError(error.message);
                setIsInitializing(false);
            }
        };

        if (session && consultationId && roomId) {
            initializeConsultation();
        }

        // Cleanup on unmount
        return () => {
            webrtcService.leaveRoom();
        };
    }, [session, consultationId, roomId]);

    // Handle audio toggle
    const handleToggleAudio = () => {
        const newState = webrtcService.toggleAudio();
        setIsAudioEnabled(newState);

        // Update participant status
        updateParticipantStatus({ isAudioEnabled: newState });
    };

    // Handle video toggle
    const handleToggleVideo = () => {
        const newState = webrtcService.toggleVideo();
        setIsVideoEnabled(newState);

        // Update participant status
        updateParticipantStatus({ isVideoEnabled: newState });
    };

    // Handle screen sharing
    const handleToggleScreenShare = async () => {
        try {
            if (isScreenSharing) {
                await webrtcService.stopScreenShare();
                setIsScreenSharing(false);
            } else {
                await webrtcService.startScreenShare();
                setIsScreenSharing(true);
            }
        } catch (error) {
            console.error('Screen sharing error:', error);
            setError('Failed to toggle screen sharing');
        }
    };

    // Update participant status
    const updateParticipantStatus = async (status) => {
        try {
            await fetch(`/api/video-consultations/${consultationId}/join`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    participantInfo: status,
                    action: 'updateMedia'
                })
            });
        } catch (error) {
            console.error('Failed to update participant status:', error);
        }
    };

    // Handle leave consultation
    const handleLeaveConsultation = async () => {
        try {
            // Leave room via API
            await fetch(`/api/video-consultations/${consultationId}/join`, {
                method: 'DELETE'
            });

            // Leave WebRTC room
            await webrtcService.leaveRoom();

            // Call parent leave handler
            if (onLeave) {
                onLeave();
            }
        } catch (error) {
            console.error('Error leaving consultation:', error);
        }
    };

    // Handle chat message send
    const handleSendMessage = () => {
        if (newMessage.trim()) {
            const message = {
                id: Date.now(),
                text: newMessage,
                sender: session.user.name,
                timestamp: new Date().toISOString()
            };

            setChatMessages(prev => [...prev, message]);
            webrtcService.sendChatMessage(newMessage);
            setNewMessage('');

            // Scroll to bottom
            setTimeout(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
            }, 100);
        }
    };

    // Handle fullscreen toggle
    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Initializing video consultation...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
                <div className="text-center">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-white text-lg font-semibold">Video Consultation</h1>
                        <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${connectionState === 'connected' ? 'bg-green-500' :
                                    connectionState === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>
                            <span className="text-gray-300 text-sm">
                                {connectionState === 'connected' ? 'Connected' :
                                    connectionState === 'connecting' ? 'Connecting...' : 'Disconnected'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 text-gray-300">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">{participants.length + 1}</span>
                        </div>
                        <button
                            onClick={handleToggleFullscreen}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                        >
                            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main video area */}
            <div className="flex-1 flex">
                {/* Video container */}
                <div className="flex-1 relative">
                    {/* Remote video (main) */}
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover bg-gray-800"
                    />

                    {/* Local video (picture-in-picture) */}
                    <div className="absolute top-4 right-4 w-64 h-48 bg-gray-800 rounded-lg border-2 border-gray-600 overflow-hidden">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                            You
                        </div>
                    </div>

                    {/* Video controls */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                        <div className="flex items-center space-x-4 bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-full px-6 py-3">
                            {/* Audio toggle */}
                            <button
                                onClick={handleToggleAudio}
                                className={`p-3 rounded-full transition-colors ${isAudioEnabled
                                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                            >
                                {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                            </button>

                            {/* Video toggle */}
                            <button
                                onClick={handleToggleVideo}
                                className={`p-3 rounded-full transition-colors ${isVideoEnabled
                                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                            >
                                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                            </button>

                            {/* Screen share */}
                            <button
                                onClick={handleToggleScreenShare}
                                className={`p-3 rounded-full transition-colors ${isScreenSharing
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-700 text-white hover:bg-gray-600'
                                    }`}
                            >
                                <Monitor className="w-5 h-5" />
                            </button>

                            {/* Chat toggle */}
                            <button
                                onClick={() => setShowChat(!showChat)}
                                className={`p-3 rounded-full transition-colors ${showChat
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-700 text-white hover:bg-gray-600'
                                    }`}
                            >
                                <MessageCircle className="w-5 h-5" />
                            </button>

                            {/* Leave call */}
                            <button
                                onClick={handleLeaveConsultation}
                                className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            >
                                <PhoneOff className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Chat sidebar */}
                {showChat && (
                    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                        {/* Chat header */}
                        <div className="p-4 border-b border-gray-700">
                            <h3 className="text-white font-semibold">Chat</h3>
                        </div>

                        {/* Chat messages */}
                        <div
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto p-4 space-y-3"
                        >
                            {chatMessages.map((message) => (
                                <div key={message.id} className="text-sm">
                                    <div className="text-gray-400 text-xs">{message.sender}</div>
                                    <div className="text-white bg-gray-700 rounded-lg p-2 mt-1">
                                        {message.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Chat input */}
                        <div className="p-4 border-t border-gray-700">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}