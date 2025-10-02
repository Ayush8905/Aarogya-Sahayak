import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import VideoConsultation from '@/models/VideoConsultation';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET - Get specific video consultation by consultation ID
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { consultationId } = params;

        const connection = await connectDB();
        if (!connection) {
            // Return mock data if database is not available
            return NextResponse.json({
                consultation: {
                    _id: 'demo-consultation-' + consultationId,
                    consultationId: consultationId,
                    patient: { name: 'John Doe', email: 'john@example.com' },
                    doctor: { name: 'Dr. Smith', specialization: 'General Medicine' },
                    scheduledTime: new Date(Date.now() + 3600000),
                    status: 'scheduled',
                    callType: 'video',
                    roomId: 'room_demo_' + consultationId,
                    notes: 'Demo consultation'
                }
            });
        }

        const consultation = await VideoConsultation.findOne({ consultationId })
            .populate('patient', 'name email phone')
            .populate('doctor', 'name email specialization')
            .populate('appointment', 'title scheduledDate description');

        if (!consultation) {
            return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
        }

        // Check if user has permission to view this consultation
        if (session.user.role === 'patient' && consultation.patient._id.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        if (session.user.role === 'worker' && consultation.doctor._id.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json({ consultation });

    } catch (error) {
        console.error('Get consultation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Update specific consultation
export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { consultationId } = params;
        const updateData = await request.json();

        const connection = await connectDB();
        if (!connection) {
            return NextResponse.json({
                message: 'Demo mode: Consultation update not persisted (database not connected)',
                status: 'success'
            });
        }

        const consultation = await VideoConsultation.findOne({ consultationId });
        if (!consultation) {
            return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
        }

        // Check if user has permission to update this consultation
        if (session.user.role === 'patient' && consultation.patient.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        if (session.user.role === 'worker' && consultation.doctor.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Handle different status updates
        if (updateData.status) {
            consultation.status = updateData.status;

            if (updateData.status === 'in-progress' && !consultation.actualStartTime) {
                consultation.actualStartTime = new Date();
            }

            if (updateData.status === 'completed' && !consultation.actualEndTime) {
                consultation.actualEndTime = new Date();
                if (consultation.actualStartTime) {
                    consultation.duration = Math.round((consultation.actualEndTime - consultation.actualStartTime) / (1000 * 60));
                }
            }
        }

        // Update other fields
        const allowedUpdates = [
            'notes', 'prescription', 'followUpRequired', 'followUpDate',
            'callQuality', 'technicalIssues'
        ];

        allowedUpdates.forEach(field => {
            if (updateData[field] !== undefined) {
                if (field === 'callQuality') {
                    // Merge call quality data
                    consultation.callQuality = {
                        ...consultation.callQuality.toObject(),
                        ...updateData.callQuality
                    };
                } else if (field === 'technicalIssues') {
                    // Add technical issues
                    if (Array.isArray(updateData.technicalIssues)) {
                        consultation.technicalIssues.push(...updateData.technicalIssues);
                    }
                } else {
                    consultation[field] = updateData[field];
                }
            }
        });

        // Update consultation details if provided
        if (updateData.consultation) {
            consultation.consultation = {
                ...consultation.consultation.toObject(),
                ...updateData.consultation
            };
        }

        await consultation.save();

        return NextResponse.json({
            consultation,
            message: 'Consultation updated successfully'
        });

    } catch (error) {
        console.error('Update consultation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Cancel consultation
export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { consultationId } = params;

        const connection = await connectDB();
        if (!connection) {
            return NextResponse.json({
                message: 'Demo mode: Consultation cancellation not persisted (database not connected)',
                status: 'success'
            });
        }

        const consultation = await VideoConsultation.findOne({ consultationId });
        if (!consultation) {
            return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
        }

        // Check if user has permission to cancel this consultation
        if (session.user.role === 'patient' && consultation.patient.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        if (session.user.role === 'worker' && consultation.doctor.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Only allow cancellation of scheduled consultations
        if (consultation.status !== 'scheduled') {
            return NextResponse.json({
                error: 'Only scheduled consultations can be cancelled'
            }, { status: 400 });
        }

        consultation.status = 'cancelled';
        consultation.notes = (consultation.notes || '') + `\n[Cancelled by ${session.user.name} at ${new Date().toISOString()}]`;

        await consultation.save();

        return NextResponse.json({
            message: 'Consultation cancelled successfully',
            consultation
        });

    } catch (error) {
        console.error('Cancel consultation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}