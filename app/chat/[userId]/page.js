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

            return () => {
                socket.off('receive_message');
                socket.off('message_sent');
            };
        }
    }, [socket]);

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
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const fetchOtherUser = async () => {
        try {
            const response = await fetch(`/api/users?role=${session.user.role === 'patient' ? 'worker' : 'patient'}`);
            if (response.ok) {
                const data = await response.json();
                const user = data.users.find(u => u._id === userId);
                setOtherUser(user);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
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
                setMessages(prev => [...prev, data.message]);
                sendMessage(userId, data.message);
                setNewMessage('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading chat...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Chat Header */}
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center">
                    <button
                        onClick={() => router.back()}
                        className="mr-3 text-gray-600 hover:text-gray-800"
                    >
                        ← Back
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold">{otherUser?.name}</h1>
                        <p className="text-sm text-gray-600">{otherUser?.specialization || 'Patient'}</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                        📞 Call
                    </button>
                    <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                        📹 Video
                    </button>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message._id}
                        className={`flex ${message.sender._id === session.user.id ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender._id === session.user.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-800 border'
                                }`}
                        >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${message.sender._id === session.user.id ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                {new Date(message.createdAt).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="bg-white border-t px-4 py-3">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
}