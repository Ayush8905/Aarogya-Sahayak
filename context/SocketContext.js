'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const { data: session } = useSession();
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            const socketInstance = io(process.env.NODE_ENV === 'development'
                ? 'http://localhost:3000'
                : window.location.origin, {
                path: '/api/socket'
            });

            socketInstance.on('connect', () => {
                console.log('Connected to socket server');
                setConnected(true);
                socketInstance.emit('join', session.user.id);
            });

            socketInstance.on('disconnect', () => {
                console.log('Disconnected from socket server');
                setConnected(false);
            });

            setSocket(socketInstance);

            return () => {
                socketInstance.disconnect();
            };
        }
    }, [session]);

    const sendMessage = (receiverId, message) => {
        if (socket && connected) {
            socket.emit('send_message', { receiverId, message });
        }
    };

    const sendTyping = (receiverId, isTyping) => {
        if (socket && connected) {
            socket.emit('typing', { receiverId, isTyping });
        }
    };

    const sendAppointmentUpdate = (recipientId, notification) => {
        if (socket && connected) {
            socket.emit('appointment_update', { recipientId, notification });
        }
    };

    return (
        <SocketContext.Provider value={{
            socket,
            connected,
            sendMessage,
            sendTyping,
            sendAppointmentUpdate
        }}>
            {children}
        </SocketContext.Provider>
    );
};