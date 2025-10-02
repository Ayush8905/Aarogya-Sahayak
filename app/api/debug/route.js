import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Appointment from '@/models/Appointment';
import Notification from '@/models/Notification';

export async function GET() {
    try {
        console.log('🔍 Debug endpoint called');

        const connection = await connectDB();
        if (!connection) {
            return NextResponse.json({
                error: 'Database connection failed',
                connected: false
            });
        }

        console.log('✅ Database connected for debug');

        // Get counts and sample data
        const [userCount, appointmentCount, notificationCount] = await Promise.all([
            User.countDocuments(),
            Appointment.countDocuments(),
            Notification.countDocuments()
        ]);

        // Get sample workers
        const workers = await User.find({ role: 'worker' }).select('-password').limit(5);

        // Get sample appointments
        const appointments = await Appointment.find()
            .populate('patient', 'name email')
            .populate('worker', 'name email specialization')
            .limit(5);

        // Get sample notifications
        const notifications = await Notification.find()
            .populate('sender', 'name')
            .limit(5);

        console.log(`📊 Debug data: ${userCount} users, ${appointmentCount} appointments, ${notificationCount} notifications`);

        return NextResponse.json({
            success: true,
            connected: true,
            counts: {
                users: userCount,
                appointments: appointmentCount,
                notifications: notificationCount
            },
            samples: {
                workers: workers.map(w => ({
                    _id: w._id,
                    name: w.name,
                    email: w.email,
                    specialization: w.specialization
                })),
                appointments: appointments.map(a => ({
                    _id: a._id,
                    title: a.title,
                    patient: a.patient?.name,
                    worker: a.worker?.name,
                    status: a.status
                })),
                notifications: notifications.map(n => ({
                    _id: n._id,
                    title: n.title,
                    message: n.message,
                    sender: n.sender?.name
                }))
            }
        });

    } catch (error) {
        console.error('❌ Debug endpoint error:', error);
        return NextResponse.json({
            error: error.message,
            connected: false
        }, { status: 500 });
    }
}