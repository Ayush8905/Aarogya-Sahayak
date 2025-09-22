import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function GET(request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const notifications = await Notification.find({
            recipient: session.user.id
        })
            .populate('sender', 'name profileImage')
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json({ notifications });

    } catch (error) {
        console.error('Get notifications error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { notificationId, markAsRead } = await request.json();

        await connectDB();

        if (notificationId) {
            // Mark specific notification as read
            await Notification.findOneAndUpdate(
                { _id: notificationId, recipient: session.user.id },
                { isRead: markAsRead, readAt: markAsRead ? new Date() : null }
            );
        } else if (markAsRead) {
            // Mark all notifications as read
            await Notification.updateMany(
                { recipient: session.user.id, isRead: false },
                { isRead: true, readAt: new Date() }
            );
        }

        return NextResponse.json({ message: 'Notification updated' });

    } catch (error) {
        console.error('Update notification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}