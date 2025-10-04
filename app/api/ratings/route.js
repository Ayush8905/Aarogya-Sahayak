import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Rating from '@/models/Rating';
import User from '@/models/User';
import Appointment from '@/models/Appointment';
import Notification from '@/models/Notification';
import { getAuthOptions } from '@/lib/auth';

// GET /api/ratings - Get ratings (with filters)
export async function GET(request) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const workerId = searchParams.get('workerId');
        const patientId = searchParams.get('patientId');
        const appointmentId = searchParams.get('appointmentId');

        await connectDB();

        let query = { isPublic: true, isReported: false };

        if (workerId) {
            query.worker = workerId;
        }

        if (patientId) {
            // Only allow users to see their own ratings or public ratings
            if (session.user.id !== patientId && session.user.role !== 'worker') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            query.patient = patientId;
            delete query.isPublic; // Show all ratings for the patient
        }

        if (appointmentId) {
            query.appointment = appointmentId;
        }

        const ratings = await Rating.find(query)
            .populate('patient', 'name profileImage')
            .populate('worker', 'name specialization profileImage')
            .populate('appointment', 'title scheduledDate')
            .sort({ createdAt: -1 })
            .limit(100);

        return NextResponse.json({ ratings });

    } catch (error) {
        console.error('Get ratings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/ratings - Create a new rating
export async function POST(request) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);
        
        if (!session || session.user.role !== 'patient') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { appointmentId, workerId, rating, comment, isPublic } = await request.json();

        // Validation
        if (!appointmentId || !workerId || !rating) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
        }

        if (comment && comment.length > 1000) {
            return NextResponse.json({ error: 'Comment too long (max 1000 characters)' }, { status: 400 });
        }

        await connectDB();

        // Verify appointment exists and belongs to the patient
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            patient: session.user.id,
            worker: workerId
        });

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        // Check if appointment is completed
        if (appointment.status !== 'completed') {
            return NextResponse.json({ 
                error: 'Can only rate completed appointments' 
            }, { status: 400 });
        }

        // Check if rating already exists
        const existingRating = await Rating.findOne({ appointment: appointmentId });
        if (existingRating) {
            return NextResponse.json({ 
                error: 'You have already rated this appointment' 
            }, { status: 400 });
        }

        // Create rating
        const newRating = await Rating.create({
            appointment: appointmentId,
            patient: session.user.id,
            worker: workerId,
            rating: rating,
            comment: comment || '',
            isPublic: isPublic !== undefined ? isPublic : true
        });

        // Update appointment to mark as rated
        await Appointment.findByIdAndUpdate(appointmentId, {
            hasRating: true,
            ratingId: newRating._id
        });

        // Update worker's average rating
        const allRatings = await Rating.find({ worker: workerId });
        const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
        
        await User.findByIdAndUpdate(workerId, {
            avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
            reviewCount: allRatings.length
        });

        // Create notification for worker
        await Notification.create({
            recipient: workerId,
            sender: session.user.id,
            title: 'New Review Received',
            message: `You received a ${rating}-star review from ${session.user.name}`,
            type: 'system'
        });

        const populatedRating = await Rating.findById(newRating._id)
            .populate('patient', 'name profileImage')
            .populate('worker', 'name specialization')
            .populate('appointment', 'title scheduledDate');

        return NextResponse.json({ 
            rating: populatedRating,
            message: 'Rating submitted successfully' 
        }, { status: 201 });

    } catch (error) {
        console.error('Create rating error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/ratings/:id - Update rating (edit or report)
export async function PUT(request) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const ratingId = searchParams.get('id');
        const { action, workerResponse, reportReason } = await request.json();

        if (!ratingId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        const rating = await Rating.findById(ratingId);
        if (!rating) {
            return NextResponse.json({ error: 'Rating not found' }, { status: 404 });
        }

        if (action === 'respond' && session.user.role === 'worker') {
            // Worker responding to review
            if (rating.worker.toString() !== session.user.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            rating.workerResponse = workerResponse;
            rating.respondedAt = new Date();
            await rating.save();

            return NextResponse.json({ 
                rating,
                message: 'Response added successfully' 
            });
        }

        if (action === 'report') {
            // Report inappropriate review
            rating.isReported = true;
            rating.reportReason = reportReason;
            rating.reportedBy = session.user.id;
            rating.reportedAt = new Date();
            await rating.save();

            return NextResponse.json({ 
                message: 'Review reported successfully' 
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Update rating error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
