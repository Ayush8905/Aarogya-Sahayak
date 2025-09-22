import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import User from '@/models/User';

export async function GET(request) {
    try {
        const session = await getServerSession();
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

        await connectDB();

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
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { receiverId, content, messageType = 'text', fileUrl = '' } = await request.json();

        if (!receiverId || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        // Verify receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
        }

        // Create message
        const message = new Message({
            sender: session.user.id,
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