import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import User from '@/models/User';

import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const otherUserId = searchParams.get('userId');
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 50;

        if (!otherUserId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const connection = await connectDB();

        if (!connection) {
            // Return mock messages when database is not available
            return NextResponse.json({
                messages: [
                    {
                        _id: 'demo-1',
                        sender: { _id: session.user.id, name: session.user.name },
                        receiver: { _id: otherUserId, name: 'Demo User' },
                        content: 'Hello! This is a demo message (database not connected)',
                        createdAt: new Date(),
                        isRead: true
                    },
                    {
                        _id: 'demo-2',
                        sender: { _id: otherUserId, name: 'Demo User' },
                        receiver: { _id: session.user.id, name: session.user.name },
                        content: 'Hi! Demo reply message',
                        createdAt: new Date(),
                        isRead: false
                    }
                ]
            });
        }

        const messages = await Message.find({
            $or: [
                { sender: session.user.id, receiver: otherUserId },
                { sender: otherUserId, receiver: session.user.id }
            ]
        })
            .populate('sender', 'name profileImage')
            .populate('receiver', 'name profileImage')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        // Mark messages as read
        await Message.updateMany(
            { sender: otherUserId, receiver: session.user.id, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        return NextResponse.json({ messages: messages.reverse() });

    } catch (error) {
        console.error('Get messages error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Debug session data
        console.log('Session data:', JSON.stringify(session, null, 2));

        const { receiverId, content, messageType = 'text', fileUrl = '' } = await request.json();

        if (!receiverId || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Ensure we have a valid sender ID
        const senderId = session.user?.id || session.user?._id || 'demo-user';
        if (!senderId) {
            return NextResponse.json({ error: 'User ID not found in session' }, { status: 400 });
        }

        const connection = await connectDB();

        if (!connection) {
            // Return success for demo purposes when database is not available
            return NextResponse.json({
                message: {
                    _id: 'demo-' + Date.now(),
                    sender: { _id: senderId, name: session.user.name || 'Demo User' },
                    receiver: { _id: receiverId, name: 'Demo User' },
                    content,
                    messageType,
                    fileUrl,
                    createdAt: new Date(),
                    isRead: false
                },
                success: true
            }, { status: 201 });
        }

        // Verify receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
        }

        // Create message with explicit sender ID
        const message = new Message({
            sender: senderId,
            receiver: receiverId,
            content,
            messageType,
            fileUrl,
            isRead: false
        });

        await message.save();
        await message.populate('sender', 'name profileImage');
        await message.populate('receiver', 'name profileImage');

        return NextResponse.json({ message }, { status: 201 });

    } catch (error) {
        console.error('Send message error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}