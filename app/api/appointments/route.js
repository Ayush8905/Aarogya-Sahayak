import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function GET(request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const role = session.user.role;

        await connectDB();

        let query = {};
        if (role === 'patient') {
            query.patient = session.user.id;
        } else if (role === 'worker') {
            query.worker = session.user.id;
        }

        if (status) {
            query.status = status;
        }

        const appointments = await Appointment.find(query)
            .populate('patient', 'name email phone')
            .populate('worker', 'name email specialization')
            .sort({ scheduledDate: 1 });

        return NextResponse.json({ appointments });

    } catch (error) {
        console.error('Get appointments error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            workerId,
            title,
            description,
            scheduledDate,
            duration = 30,
            appointmentType
        } = await request.json();

        if (!workerId || !title || !scheduledDate || !appointmentType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Only patients can create appointments
        if (session.user.role !== 'patient') {
            return NextResponse.json({ error: 'Only patients can book appointments' }, { status: 403 });
        }

        await connectDB();

        // Verify worker exists
        const worker = await User.findById(workerId);
        if (!worker || worker.role !== 'worker') {
            return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
        }

        // Check for scheduling conflicts
        const conflictingAppointment = await Appointment.findOne({
            worker: workerId,
            scheduledDate: new Date(scheduledDate),
            status: { $in: ['pending', 'approved'] }
        });

        if (conflictingAppointment) {
            return NextResponse.json({ error: 'Time slot already booked' }, { status: 409 });
        }

        // Create appointment
        const appointment = new Appointment({
            patient: session.user.id,
            worker: workerId,
            title,
            description,
            scheduledDate: new Date(scheduledDate),
            duration,
            appointmentType,
            status: 'pending'
        });

        await appointment.save();

        // Create notification for worker
        const notification = new Notification({
            recipient: workerId,
            sender: session.user.id,
            title: 'New Appointment Request',
            message: `${session.user.name} has requested an appointment: ${title}`,
            type: 'appointment',
            relatedId: appointment._id
        });

        await notification.save();

        await appointment.populate('patient', 'name email phone');
        await appointment.populate('worker', 'name email specialization');

        return NextResponse.json({ appointment }, { status: 201 });

    } catch (error) {
        console.error('Create appointment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}