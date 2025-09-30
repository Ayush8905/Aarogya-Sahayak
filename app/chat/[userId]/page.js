'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';

export default function ChatPage({ params }) {
    const { data: session } = useSession();
    const router = useRouter();
    const { socket, sendMessage } = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [otherUser, setOtherUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [typing, setTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const messagesEndRef = useRef(null);
    const { userId } = params;

    useEffect(() => {
        if (!session) {
            router.push('/auth/signin');
            return;
        }

        fetchMessages();
        fetchOtherUser();
    }, [session, userId]);

    useEffect(() => {
        if (socket) {
            socket.on('receive_message', (message) => {
                setMessages(prev => [...prev, message]);
            });

            socket.on('message_sent', (message) => {
                // Message confirmation
            });

            socket.on('user_typing', (data) => {
                if (data.userId === userId) {
                    setTyping(true);
                    setTimeout(() => setTyping(false), 3000);
                }
            });

            socket.on('user_online', (data) => {
                if (data.userId === userId) {
                    setIsOnline(true);
                }
            });

            socket.on('user_offline', (data) => {
                if (data.userId === userId) {
                    setIsOnline(false);
                }
            });

            return () => {
                socket.off('receive_message');
                socket.off('message_sent');
                socket.off('user_typing');
                socket.off('user_online');
                socket.off('user_offline');
            };
        }
    }, [socket, userId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        try {
            const response = await fetch(`/api/messages?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages || []);
            } else {
                console.error('Failed to fetch messages:', response.status);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const fetchOtherUser = async () => {
        try {
            // First try to get all users, then find the specific one
            const response = await fetch(`/api/users?role=${session?.user?.role === 'patient' ? 'worker' : 'patient'}`);
            if (response.ok) {
                const data = await response.json();
                const user = data.users?.find(u => u._id === userId);
                if (user) {
                    setOtherUser(user);
                } else {
                    // If not found in the opposite role, try the same role (for demo purposes)
                    const sameRoleResponse = await fetch(`/api/users?role=${session?.user?.role}`);
                    if (sameRoleResponse.ok) {
                        const sameRoleData = await sameRoleResponse.json();
                        const sameRoleUser = sameRoleData.users?.find(u => u._id === userId);
                        setOtherUser(sameRoleUser || { _id: userId, name: 'Unknown User', role: 'unknown' });
                    } else {
                        setOtherUser({ _id: userId, name: 'Unknown User', role: 'unknown' });
                    }
                }
            } else {
                console.error('Failed to fetch users:', response.status);
                setOtherUser({ _id: userId, name: 'Unknown User', role: 'unknown' });
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            setOtherUser({ _id: userId, name: 'Unknown User', role: 'unknown' });
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            receiverId: userId,
            content: newMessage,
            messageType: 'text'
        };

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });

            if (response.ok) {
                const data = await response.json();
                // Add message to local state immediately
                const newMessageObj = data.message || {
                    _id: 'temp-' + Date.now(),
                    sender: { _id: session.user.id, name: session.user.name },
                    receiver: { _id: userId, name: otherUser?.name || 'User' },
                    content: newMessage,
                    createdAt: new Date(),
                    isRead: false
                };

                setMessages(prev => [...prev, newMessageObj]);

                // Send through socket if available
                if (sendMessage) {
                    sendMessage(userId, newMessageObj);
                }

                setNewMessage('');
            } else {
                alert('Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleTyping = () => {
        if (socket) {
            socket.emit('typing', { userId: session?.user?.id, targetUserId: userId });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="loading-shimmer w-16 h-16 rounded-full mx-auto mb-4"></div>
                    <div className="text-xl text-gray-600 animate-pulse-custom">Loading chat...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Enhanced Chat Header */}
            <div className="glass shadow-lg px-6 py-4 backdrop-blur-md border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.back()}
                            className="btn-animated bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-full transition-all duration-300"
                        >
                            <span className="text-lg">←</span>
                        </button>
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                {isOnline && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse-custom"></div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-800">{otherUser?.name || 'Unknown User'}</h1>
                                <p className="text-sm text-gray-600 flex items-center space-x-2">
                                    <span>{otherUser?.specialization || 'Patient'}</span>
                                    {isOnline && (
                                        <>
                                            <span>•</span>
                                            <span className="text-green-600 font-medium">Online</span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button className="btn-animated bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2">
                            <span>📞</span>
                            <span className="hidden sm:inline">Call</span>
                        </button>
                        <button className="btn-animated bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2">
                            <span>📹</span>
                            <span className="hidden sm:inline">Video</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Enhanced Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                    <div
                        key={message._id}
                        className={`flex message-bubble ${message.sender?._id === session?.user?.id ? 'justify-end' : 'justify-start'}`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <div
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${message.sender?._id === session?.user?.id
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                : 'bg-white text-gray-800 border border-gray-200'
                                }`}
                        >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <p className={`text-xs mt-2 ${message.sender?._id === session?.user?.id ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {typing && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-lg">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Message Input */}
            <form onSubmit={handleSendMessage} className="glass backdrop-blur-md border-t p-4">
                <div className="flex items-center space-x-3">
                    <button
                        type="button"
                        className="btn-animated bg-gray-200 hover:bg-gray-300 text-gray-600 p-3 rounded-full"
                    >
                        📎
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                handleTyping();
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            placeholder="Type your message..."
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm"
                            style={{
                                color: '#1f2937 !important',
                                backgroundColor: 'white !important'
                            }}
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            😊
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="btn-animated bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white p-3 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        <span className="text-lg">📤</span>
                    </button>
                </div>
            </form>
        </div>
    );
}