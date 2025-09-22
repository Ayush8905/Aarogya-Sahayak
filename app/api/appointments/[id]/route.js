import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Notification from '@/models/Notification';

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const { status, workerResponse } = await request.json();

        if (!['approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        await connectDB();

        const appointment = await Appointment.findById(id)
            .populate('patient', 'name email')
            .populate('worker', 'name email');

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        // Check authorization
        const canUpdate = (
            (session.user.role === 'worker' && appointment.worker._id.toString() === session.user.id) ||
            (session.user.role === 'patient' && appointment.patient._id.toString() === session.user.id)
        );

        if (!canUpdate) {
            return NextResponse.json({ error: 'Not authorized to update this appointment' }, { status: 403 });
        }

        // Update appointment
        appointment.status = status;
        if (workerResponse && session.user.role === 'worker') {
            appointment.workerResponse = {
                message: workerResponse,
                respondedAt: new Date()
            };
        }

        await appointment.save();

        // Create notification
        const recipientId = session.user.role === 'worker' ? appointment.patient._id : appointment.worker._id;
        const statusMessages = {
            approved: 'Your appointment has been approved',
            rejected: 'Your appointment has been rejected',
            completed: 'Your appointment has been completed',
            cancelled: 'Your appointment has been cancelled'
        };

        const notification = new Notification({
            recipient: recipientId,
            sender: session.user.id,
            title: 'Appointment Update',
            message: statusMessages[status],
            type: 'appointment',
            relatedId: appointment._id
        });

        await notification.save();

        return NextResponse.json({ appointment });

    } catch (error) {
        console.error('Update appointment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}