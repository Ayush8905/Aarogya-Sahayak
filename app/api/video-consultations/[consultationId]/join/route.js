import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import VideoConsultation from '@/models/VideoConsultation';
import User from '@/models/User';
import { authOptions } from '../../../auth/[...nextauth]/route';

// POST - Join video consultation room
export async function POST(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { consultationId } = params;
        const { participantInfo } = await request.json();

        const connection = await connectDB();
        if (!connection) {
            // Return demo room access when database is not available
            return NextResponse.json({
                success: true,
                roomId: 'room_demo_' + consultationId,
                participantId: 'participant_' + session.user.id,
                participantInfo: {
                    id: session.user.id,
                    name: session.user.name,
                    role: session.user.role,
                    isAudioEnabled: true,
                    isVideoEnabled: true
                },
                consultation: {
                    consultationId,
                    status: 'in-progress',
                    roomId: 'room_demo_' + consultationId
                },
                message: 'Demo mode: Joined consultation room (database not connected)'
            });
        }

        const consultation = await VideoConsultation.findOne({ consultationId })
            .populate('patient', 'name email')
            .populate('doctor', 'name email specialization');

        if (!consultation) {
            return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
        }

        // Check if user has permission to join this consultation
        const isPatient = consultation.patient._id.toString() === session.user.id;
        const isDoctor = consultation.doctor._id.toString() === session.user.id;

        if (!isPatient && !isDoctor) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Check if consultation can be joined
        if (consultation.status === 'cancelled') {
            return NextResponse.json({ error: 'This consultation has been cancelled' }, { status: 400 });
        }

        if (consultation.status === 'completed') {
            return NextResponse.json({ error: 'This consultation has already been completed' }, { status: 400 });
        }

        // Update consultation status to in-progress if it's the first participant joining
        if (consultation.status === 'scheduled') {
            consultation.status = 'in-progress';
            consultation.actualStartTime = new Date();
        }

        // Add participant information
        const participant = {
            id: session.user.id,
            name: session.user.name,
            role: session.user.role,
            joinedAt: new Date(),
            isAudioEnabled: participantInfo?.isAudioEnabled ?? true,
            isVideoEnabled: participantInfo?.isVideoEnabled ?? true,
            ...participantInfo
        };

        // Check if participant already exists
        const existingParticipantIndex = consultation.participants.findIndex(
            p => p.id === session.user.id
        );

        if (existingParticipantIndex >= 0) {
            // Update existing participant
            consultation.participants[existingParticipantIndex] = {
                ...consultation.participants[existingParticipantIndex].toObject(),
                ...participant,
                lastActiveAt: new Date()
            };
        } else {
            // Add new participant
            consultation.participants.push(participant);
        }

        await consultation.save();

        // Generate participant access token/ID for WebRTC
        const participantId = `${consultation.roomId}_${session.user.id}_${Date.now()}`;

        return NextResponse.json({
            success: true,
            roomId: consultation.roomId,
            participantId,
            participantInfo: participant,
            consultation: {
                consultationId: consultation.consultationId,
                status: consultation.status,
                roomId: consultation.roomId,
                scheduledTime: consultation.scheduledTime,
                actualStartTime: consultation.actualStartTime,
                patient: consultation.patient,
                doctor: consultation.doctor,
                callType: consultation.callType
            },
            otherParticipants: consultation.participants.filter(p => p.id !== session.user.id)
        });

    } catch (error) {
        console.error('Join consultation room error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Update participant status in room
export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { consultationId } = params;
        const { participantInfo, action } = await request.json();

        const connection = await connectDB();
        if (!connection) {
            return NextResponse.json({
                success: true,
                message: 'Demo mode: Participant status updated (database not connected)'
            });
        }

        const consultation = await VideoConsultation.findOne({ consultationId });
        if (!consultation) {
            return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
        }

        // Find participant
        const participantIndex = consultation.participants.findIndex(
            p => p.id === session.user.id
        );

        if (participantIndex === -1) {
            return NextResponse.json({ error: 'Participant not found in consultation' }, { status: 404 });
        }

        // Update participant based on action
        if (action === 'updateMedia') {
            consultation.participants[participantIndex].isAudioEnabled = participantInfo.isAudioEnabled;
            consultation.participants[participantIndex].isVideoEnabled = participantInfo.isVideoEnabled;
        } else if (action === 'leave') {
            consultation.participants[participantIndex].leftAt = new Date();
            consultation.participants[participantIndex].isActive = false;
        } else if (action === 'reconnect') {
            consultation.participants[participantIndex].reconnectedAt = new Date();
            consultation.participants[participantIndex].isActive = true;
        }

        consultation.participants[participantIndex].lastActiveAt = new Date();

        // Check if all participants have left
        const activeParticipants = consultation.participants.filter(p => p.isActive !== false);
        if (activeParticipants.length === 0 && consultation.status === 'in-progress') {
            // Auto-complete consultation if no active participants
            consultation.status = 'completed';
            consultation.actualEndTime = new Date();
            if (consultation.actualStartTime) {
                consultation.duration = Math.round((consultation.actualEndTime - consultation.actualStartTime) / (1000 * 60));
            }
        }

        await consultation.save();

        return NextResponse.json({
            success: true,
            message: 'Participant status updated successfully',
            consultation: {
                consultationId: consultation.consultationId,
                status: consultation.status,
                participants: consultation.participants
            }
        });

    } catch (error) {
        console.error('Update participant status error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Leave consultation room
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
                success: true,
                message: 'Demo mode: Left consultation room (database not connected)'
            });
        }

        const consultation = await VideoConsultation.findOne({ consultationId });
        if (!consultation) {
            return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
        }

        // Find and update participant
        const participantIndex = consultation.participants.findIndex(
            p => p.id === session.user.id
        );

        if (participantIndex >= 0) {
            consultation.participants[participantIndex].leftAt = new Date();
            consultation.participants[participantIndex].isActive = false;
            consultation.participants[participantIndex].lastActiveAt = new Date();
        }

        // Check if this was the last active participant
        const activeParticipants = consultation.participants.filter(p => p.isActive !== false);
        if (activeParticipants.length === 0 && consultation.status === 'in-progress') {
            consultation.status = 'completed';
            consultation.actualEndTime = new Date();
            if (consultation.actualStartTime) {
                consultation.duration = Math.round((consultation.actualEndTime - consultation.actualStartTime) / (1000 * 60));
            }
        }

        await consultation.save();

        return NextResponse.json({
            success: true,
            message: 'Left consultation room successfully'
        });

    } catch (error) {
        console.error('Leave consultation room error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}