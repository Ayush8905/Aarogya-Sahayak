import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Waitlist from '@/models/Waitlist';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { getAuthOptions } from '@/lib/auth';

// GET /api/waitlist - Get waitlist entries
export async function GET(request) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const workerId = searchParams.get('workerId');
        const status = searchParams.get('status');

        await connectDB();

        let query = {};

        if (session.user.role === 'patient') {
            query.patient = session.user.id;
        } else if (session.user.role === 'worker') {
            query.worker = workerId || session.user.id;
        }

        if (status) {
            query.status = status;
        }

        const waitlistEntries = await Waitlist.find(query)
            .populate('patient', 'name email phone profileImage')
            .populate('worker', 'name specialization profileImage')
            .sort({ priority: -1, createdAt: 1 });

        return NextResponse.json({ waitlist: waitlistEntries });

    } catch (error) {
        console.error('Get waitlist error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/waitlist - Join waitlist
export async function POST(request) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);
        
        if (!session || session.user.role !== 'patient') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            workerId, 
            preferredDate, 
            preferredTimeSlot, 
            appointmentType, 
            notes 
        } = await request.json();

        // Validation
        if (!workerId || !preferredDate || !appointmentType) {
            return NextResponse.json({ 
                error: 'Missing required fields' 
            }, { status: 400 });
        }

        await connectDB();

        // Verify worker exists
        const worker = await User.findOne({ _id: workerId, role: 'worker', isActive: true });
        if (!worker) {
            return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
        }

        // Check if patient already on waitlist for this worker
        const existingEntry = await Waitlist.findOne({
            patient: session.user.id,
            worker: workerId,
            status: { $in: ['waiting', 'notified'] }
        });

        if (existingEntry) {
            return NextResponse.json({ 
                error: 'You are already on the waitlist for this doctor' 
            }, { status: 400 });
        }

        // Set expiration date (7 days from preferred date)
        const expiresAt = new Date(preferredDate);
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create waitlist entry
        const waitlistEntry = await Waitlist.create({
            patient: session.user.id,
            worker: workerId,
            preferredDate: new Date(preferredDate),
            preferredTimeSlot: preferredTimeSlot || 'any',
            appointmentType,
            notes: notes || '',
            expiresAt,
            status: 'waiting',
            priority: 0
        });

        // Notify worker
        await Notification.create({
            recipient: workerId,
            sender: session.user.id,
            title: 'New Waitlist Entry',
            message: `${session.user.name} joined your waitlist for ${appointmentType}`,
            type: 'system'
        });

        const populatedEntry = await Waitlist.findById(waitlistEntry._id)
            .populate('patient', 'name email phone')
            .populate('worker', 'name specialization');

        return NextResponse.json({ 
            waitlist: populatedEntry,
            message: 'Successfully joined waitlist' 
        }, { status: 201 });

    } catch (error) {
        console.error('Create waitlist entry error:', error);
        
        // Handle duplicate entry error
        if (error.code === 11000) {
            return NextResponse.json({ 
                error: 'You are already on the waitlist for this doctor' 
            }, { status: 400 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/waitlist/:id - Update waitlist entry status
export async function PUT(request) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const waitlistId = searchParams.get('id');
        const { status, bookedAppointmentId } = await request.json();

        if (!waitlistId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        const waitlistEntry = await Waitlist.findById(waitlistId);
        if (!waitlistEntry) {
            return NextResponse.json({ error: 'Waitlist entry not found' }, { status: 404 });
        }

        // Authorization check
        if (session.user.role === 'patient' && waitlistEntry.patient.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (session.user.role === 'worker' && waitlistEntry.worker.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update status
        waitlistEntry.status = status;

        if (status === 'notified') {
            waitlistEntry.notifiedAt = new Date();
            
            // Notify patient about slot availability
            await Notification.create({
                recipient: waitlistEntry.patient,
                sender: waitlistEntry.worker,
                title: 'Appointment Slot Available!',
                message: 'A slot is now available. Book your appointment soon!',
                type: 'system',
                relatedId: waitlistEntry._id
            });
        }

        if (status === 'booked' && bookedAppointmentId) {
            waitlistEntry.bookedAppointmentId = bookedAppointmentId;
        }

        await waitlistEntry.save();

        return NextResponse.json({ 
            waitlist: waitlistEntry,
            message: 'Waitlist updated successfully' 
        });

    } catch (error) {
        console.error('Update waitlist error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/waitlist/:id - Remove from waitlist
export async function DELETE(request) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);
        
        if (!session || session.user.role !== 'patient') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const waitlistId = searchParams.get('id');

        if (!waitlistId) {
            return NextResponse.json({ error: 'Missing waitlist ID' }, { status: 400 });
        }

        await connectDB();

        const waitlistEntry = await Waitlist.findOne({
            _id: waitlistId,
            patient: session.user.id
        });

        if (!waitlistEntry) {
            return NextResponse.json({ error: 'Waitlist entry not found' }, { status: 404 });
        }

        // Update status to cancelled instead of deleting
        waitlistEntry.status = 'cancelled';
        await waitlistEntry.save();

        return NextResponse.json({ 
            message: 'Removed from waitlist successfully' 
        });

    } catch (error) {
        console.error('Delete waitlist entry error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
