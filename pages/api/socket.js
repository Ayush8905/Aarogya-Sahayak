import { Server } from 'socket.io';

const SocketHandler = (req, res) => {
    if (res.socket.server.io) {
        console.log('Socket is already running');
    } else {
        console.log('Socket is initializing');
        const io = new Server(res.socket.server);
        res.socket.server.io = io;

        const connectedUsers = new Map(); // userId -> socketId

        io.on('connection', (socket) => {
            console.log('User connected:', socket.id);

            // User joins with their ID
            socket.on('join', (userId) => {
                connectedUsers.set(userId, socket.id);
                socket.userId = userId;
                console.log(`User ${userId} joined with socket ${socket.id}`);
            });

            // Handle sending messages
            socket.on('send_message', (data) => {
                const { receiverId, message } = data;
                const receiverSocketId = connectedUsers.get(receiverId);

                if (receiverSocketId) {
                    // Send to receiver
                    io.to(receiverSocketId).emit('receive_message', message);
                }

                // Echo back to sender for confirmation
                socket.emit('message_sent', message);
            });

            // Handle typing indicators
            socket.on('typing', (data) => {
                const { receiverId, isTyping } = data;
                const receiverSocketId = connectedUsers.get(receiverId);

                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('user_typing', {
                        userId: socket.userId,
                        isTyping
                    });
                }
            });

            // Handle appointment notifications
            socket.on('appointment_update', (data) => {
                const { recipientId, notification } = data;
                const recipientSocketId = connectedUsers.get(recipientId);

                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('new_notification', notification);
                }
            });

            // Video consultation signaling
            socket.on('join-video-room', ({ roomId, participantId }) => {
                console.log(`Participant ${participantId} joining video room ${roomId}`);
                socket.join(roomId);
                socket.to(roomId).emit('participant-joined', { participantId, socketId: socket.id });
            });

            socket.on('video-offer', ({ roomId, offer, participantId }) => {
                console.log(`Video offer from ${participantId} in room ${roomId}`);
                socket.to(roomId).emit('video-offer', { offer, participantId, socketId: socket.id });
            });

            socket.on('video-answer', ({ roomId, answer, participantId }) => {
                console.log(`Video answer from ${participantId} in room ${roomId}`);
                socket.to(roomId).emit('video-answer', { answer, participantId, socketId: socket.id });
            });

            socket.on('ice-candidate', ({ roomId, candidate, participantId }) => {
                socket.to(roomId).emit('ice-candidate', { candidate, participantId, socketId: socket.id });
            });

            socket.on('leave-video-room', ({ roomId, participantId }) => {
                console.log(`Participant ${participantId} leaving video room ${roomId}`);
                socket.to(roomId).emit('participant-left', { participantId, socketId: socket.id });
                socket.leave(roomId);
            });

            // Handle user disconnect
            socket.on('disconnect', () => {
                if (socket.userId) {
                    connectedUsers.delete(socket.userId);
                    console.log(`User ${socket.userId} disconnected`);
                }
            });
        });
    }
    res.end();
};

export default SocketHandler;