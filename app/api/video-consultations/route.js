import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import VideoConsultation from '@/models/VideoConsultation';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { authOptions } from '../auth/[...nextauth]/route';

// GET - Fetch video consultations
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const appointmentId = searchParams.get('appointmentId');

        const connection = await connectDB();
        if (!connection) {
            // Return mock data if database is not available
            return NextResponse.json({
                consultations: [{
                    _id: 'mock-consultation-1',
                    consultationId: 'VC_' + Date.now(),
                    patient: { name: 'John Doe', email: 'john@example.com' },
                    doctor: { name: 'Dr. Smith', specialization: 'General Medicine' },
                    scheduledTime: new Date(Date.now() + 3600000), // 1 hour from now
                    status: 'scheduled',
                    callType: 'video',
                    roomId: 'room_demo_123'
                }]
            });
        }

        let query = {};

        // Filter by user role
        if (session.user.role === 'patient') {
            query.patient = session.user.id;
        } else if (session.user.role === 'worker') {
            query.doctor = session.user.id;
        }

        if (status) {
            query.status = status;
        }

        if (appointmentId) {
            query.appointment = appointmentId;
        }

        const consultations = await VideoConsultation.find(query)
            .populate('patient', 'name email phone')
            .populate('doctor', 'name email specialization')
            .populate('appointment', 'title scheduledDate')
            .sort({ scheduledTime: 1 });

        return NextResponse.json({ consultations });

    } catch (error) {
        console.error('Get video consultations error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create new video consultation
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            appointmentId,
            doctorId,
            scheduledTime,
            callType = 'video',
            notes
        } = await request.json();

        if (!appointmentId || !doctorId || !scheduledTime) {
            return NextResponse.json({
                error: 'Missing required fields: appointmentId, doctorId, scheduledTime'
            }, { status: 400 });
        }

        const connection = await connectDB();
        if (!connection) {
            // Return demo response when database is not available
            return NextResponse.json({
                consultation: {
                    _id: 'demo-consultation-' + Date.now(),
                    consultationId: 'VC_DEMO_' + Date.now(),
                    appointment: appointmentId,
                    patient: session.user.id,
                    doctor: doctorId,
                    scheduledTime: new Date(scheduledTime),
                    status: 'scheduled',
                    callType,
                    roomId: 'room_demo_' + Date.now(),
                    notes
                },
                message: 'Demo mode: Video consultation created (database not connected)'
            }, { status: 201 });
        }

        // Verify appointment exists and user has access
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        // Check if user has permission to create consultation for this appointment
        if (session.user.role === 'patient' && appointment.patient.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        if (session.user.role === 'worker' && appointment.worker.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Verify doctor exists
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== 'worker') {
            return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
        }

        // Check if consultation already exists for this appointment
        const existingConsultation = await VideoConsultation.findOne({ appointment: appointmentId });
        if (existingConsultation) {
            return NextResponse.json({
                error: 'Video consultation already exists for this appointment',
                consultation: existingConsultation
            }, { status: 409 });
        }

        // Generate unique consultation ID and room ID
        const consultationId = 'VC_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const roomId = VideoConsultation.generateRoomId();

        // Create video consultation
        const consultation = new VideoConsultation({
            consultationId,
            appointment: appointmentId,
            patient: appointment.patient,
            doctor: doctorId,
            scheduledTime: new Date(scheduledTime),
            callType,
            roomId,
            notes,
            status: 'scheduled'
        });

        await consultation.save();

        // Create notifications for both participants
        const notifications = [
            {
                recipient: appointment.patient,
                sender: session.user.id,
                title: 'Video Consultation Scheduled',
                message: `Your video consultation with ${doctor.name} has been scheduled for ${new Date(scheduledTime).toLocaleString()}`,
                type: 'video-consultation',
                relatedId: consultation._id
            },
            {
                recipient: doctorId,
                sender: session.user.id,
                title: 'Video Consultation Scheduled',
                message: `Video consultation with patient has been scheduled for ${new Date(scheduledTime).toLocaleString()}`,
                type: 'video-consultation',
                relatedId: consultation._id
            }
        ];

        await Notification.insertMany(notifications);

        // Populate the consultation data
        await consultation.populate([
            { path: 'patient', select: 'name email phone' },
            { path: 'doctor', select: 'name email specialization' },
            { path: 'appointment', select: 'title scheduledDate' }
        ]);

        return NextResponse.json({ consultation }, { status: 201 });

    } catch (error) {
        console.error('Create video consultation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Update video consultation status
export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            consultationId,
            status,
            notes,
            prescription,
            diagnosis,
            recommendations,
            medications,
            followUpRequired,
            followUpDate,
            callQuality
        } = await request.json();

        if (!consultationId) {
            return NextResponse.json({ error: 'Consultation ID required' }, { status: 400 });
        }

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

        // Update consultation
        if (status) consultation.status = status;
        if (notes) consultation.notes = notes;
        if (prescription) consultation.prescription = prescription;
        if (diagnosis) consultation.consultation.diagnosis = diagnosis;
        if (recommendations) consultation.consultation.recommendations = recommendations;
        if (medications) consultation.consultation.medications = medications;
        if (followUpRequired !== undefined) consultation.followUpRequired = followUpRequired;
        if (followUpDate) consultation.followUpDate = new Date(followUpDate);
        if (callQuality) {
            if (session.user.role === 'patient') {
                consultation.callQuality.patient = { ...consultation.callQuality.patient, ...callQuality };
            } else {
                consultation.callQuality.doctor = { ...consultation.callQuality.doctor, ...callQuality };
            }
        }

        // Handle status changes
        if (status === 'in-progress' && !consultation.actualStartTime) {
            consultation.actualStartTime = new Date();
        }
        if (status === 'completed' && !consultation.actualEndTime) {
            consultation.actualEndTime = new Date();
            if (consultation.actualStartTime) {
                consultation.duration = Math.round((consultation.actualEndTime - consultation.actualStartTime) / (1000 * 60));
            }
        }

        await consultation.save();

        return NextResponse.json({
            consultation,
            message: 'Consultation updated successfully'
        });

    } catch (error) {
        console.error('Update video consultation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}