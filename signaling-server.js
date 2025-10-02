// Socket.IO server for real-time video consultation signaling
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3001;

// Create Next.js app instance
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Room management
const rooms = new Map();
const participants = new Map();

// Helper function to log with timestamp
const log = (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    // Initialize Socket.IO server
    const io = new Server(server, {
        cors: {
            origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
            methods: ["GET", "POST"]
        },
        transports: ['websocket', 'polling']
    });

    // Socket.IO connection handling
    io.on('connection', (socket) => {
        log(`Client connected: ${socket.id}`);

        // Join video consultation room
        socket.on('join-room', ({ roomId, participantId, consultationId }) => {
            log(`Join room request`, { roomId, participantId, consultationId, socketId: socket.id });

            try {
                // Initialize room if it doesn't exist
                if (!rooms.has(roomId)) {
                    rooms.set(roomId, {
                        id: roomId,
                        consultationId,
                        participants: new Set(),
                        createdAt: new Date(),
                        maxParticipants: 10 // Configurable
                    });
                    log(`Room created: ${roomId}`);
                }

                const room = rooms.get(roomId);

                // Check room capacity
                if (room.participants.size >= room.maxParticipants) {
                    socket.emit('room-full', { roomId });
                    log(`Room full: ${roomId}`, { currentParticipants: room.participants.size });
                    return;
                }

                // Join the socket room
                socket.join(roomId);

                // Store participant information
                const participantInfo = {
                    id: participantId,
                    socketId: socket.id,
                    roomId,
                    consultationId,
                    joinedAt: new Date(),
                    isActive: true
                };

                participants.set(socket.id, participantInfo);
                room.participants.add(socket.id);

                // Notify other participants in the room
                socket.to(roomId).emit('participant-joined', {
                    participantId,
                    socketId: socket.id,
                    joinedAt: participantInfo.joinedAt
                });

                // Send current room info to the joining participant
                const otherParticipants = Array.from(room.participants)
                    .filter(socketId => socketId !== socket.id)
                    .map(socketId => participants.get(socketId))
                    .filter(Boolean);

                socket.emit('room-joined', {
                    roomId,
                    participantId,
                    otherParticipants: otherParticipants.map(p => ({
                        participantId: p.id,
                        socketId: p.socketId,
                        joinedAt: p.joinedAt
                    }))
                });

                log(`Participant joined room`, {
                    roomId,
                    participantId,
                    totalParticipants: room.participants.size
                });

            } catch (error) {
                log(`Error joining room: ${error.message}`, { roomId, participantId });
                socket.emit('room-error', {
                    error: 'Failed to join room',
                    details: error.message
                });
            }
        });

        // WebRTC offer signaling
        socket.on('offer', ({ roomId, offer, participantId }) => {
            log(`WebRTC offer received`, { roomId, participantId, socketId: socket.id });

            try {
                socket.to(roomId).emit('offer', {
                    offer,
                    participantId,
                    socketId: socket.id
                });
                log(`WebRTC offer forwarded to room: ${roomId}`);
            } catch (error) {
                log(`Error forwarding offer: ${error.message}`, { roomId, participantId });
            }
        });

        // WebRTC answer signaling
        socket.on('answer', ({ roomId, answer, participantId }) => {
            log(`WebRTC answer received`, { roomId, participantId, socketId: socket.id });

            try {
                socket.to(roomId).emit('answer', {
                    answer,
                    participantId,
                    socketId: socket.id
                });
                log(`WebRTC answer forwarded to room: ${roomId}`);
            } catch (error) {
                log(`Error forwarding answer: ${error.message}`, { roomId, participantId });
            }
        });

        // ICE candidate signaling
        socket.on('ice-candidate', ({ roomId, candidate, participantId }) => {
            log(`ICE candidate received`, { roomId, participantId });

            try {
                socket.to(roomId).emit('ice-candidate', {
                    candidate,
                    participantId,
                    socketId: socket.id
                });
            } catch (error) {
                log(`Error forwarding ICE candidate: ${error.message}`, { roomId, participantId });
            }
        });

        // Chat message handling
        socket.on('chat-message', ({ roomId, message, participantId }) => {
            log(`Chat message received`, { roomId, participantId });

            try {
                const participant = participants.get(socket.id);
                if (participant && participant.roomId === roomId) {
                    socket.to(roomId).emit('chat-message', {
                        message,
                        participantId,
                        timestamp: new Date().toISOString(),
                        socketId: socket.id
                    });
                }
            } catch (error) {
                log(`Error forwarding chat message: ${error.message}`, { roomId, participantId });
            }
        });

        // Media state updates (audio/video toggle)
        socket.on('media-state-update', ({ roomId, participantId, isAudioEnabled, isVideoEnabled }) => {
            log(`Media state update`, { roomId, participantId, isAudioEnabled, isVideoEnabled });

            try {
                socket.to(roomId).emit('participant-media-update', {
                    participantId,
                    socketId: socket.id,
                    isAudioEnabled,
                    isVideoEnabled,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                log(`Error forwarding media state update: ${error.message}`);
            }
        });

        // Leave room explicitly
        socket.on('leave-room', ({ roomId, participantId }) => {
            log(`Leave room request`, { roomId, participantId, socketId: socket.id });
            handleParticipantLeave(socket, roomId, participantId);
        });

        // Handle disconnect
        socket.on('disconnect', (reason) => {
            log(`Client disconnected: ${socket.id}, reason: ${reason}`);

            const participant = participants.get(socket.id);
            if (participant) {
                handleParticipantLeave(socket, participant.roomId, participant.id);
            }
        });

        // Error handling
        socket.on('error', (error) => {
            log(`Socket error for ${socket.id}: ${error.message}`);
        });
    });

    // Helper function to handle participant leaving
    function handleParticipantLeave(socket, roomId, participantId) {
        try {
            const room = rooms.get(roomId);
            if (room) {
                // Remove participant from room
                room.participants.delete(socket.id);

                // Notify other participants
                socket.to(roomId).emit('participant-left', {
                    participantId,
                    socketId: socket.id,
                    leftAt: new Date().toISOString()
                });

                // Clean up empty room
                if (room.participants.size === 0) {
                    rooms.delete(roomId);
                    log(`Room deleted: ${roomId} (empty)`);
                } else {
                    log(`Participant left room`, {
                        roomId,
                        participantId,
                        remainingParticipants: room.participants.size
                    });
                }
            }

            // Remove participant data
            participants.delete(socket.id);

            // Leave socket room
            socket.leave(roomId);

        } catch (error) {
            log(`Error handling participant leave: ${error.message}`, { roomId, participantId });
        }
    }

    // Periodic cleanup of stale rooms and participants
    setInterval(() => {
        const now = new Date();
        const staleThreshold = 1000 * 60 * 60; // 1 hour

        // Clean up stale rooms
        for (const [roomId, room] of rooms.entries()) {
            if (now - room.createdAt > staleThreshold && room.participants.size === 0) {
                rooms.delete(roomId);
                log(`Cleaned up stale room: ${roomId}`);
            }
        }

        // Clean up stale participants
        for (const [socketId, participant] of participants.entries()) {
            if (now - participant.joinedAt > staleThreshold) {
                participants.delete(socketId);
                log(`Cleaned up stale participant: ${participant.id}`);
            }
        }

        // Log current status
        if (rooms.size > 0 || participants.size > 0) {
            log(`Current status: ${rooms.size} rooms, ${participants.size} participants`);
        }
    }, 1000 * 60 * 30); // Run every 30 minutes

    // Graceful shutdown handling
    const gracefulShutdown = () => {
        log('Received shutdown signal, closing server gracefully...');

        // Notify all clients about server shutdown
        io.emit('server-shutdown', {
            message: 'Server is shutting down, please reconnect in a few moments'
        });

        // Close all connections
        io.close(() => {
            log('Socket.IO server closed');
            server.close(() => {
                log('HTTP server closed');
                process.exit(0);
            });
        });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Start the server
    server.listen(port, (err) => {
        if (err) throw err;
        log(`> Ready on http://${hostname}:${port}`);
        log(`> Socket.IO server ready for video consultation signaling`);
    });
});

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
    log('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    log('Uncaught Exception:', error.message);
    process.exit(1);
});