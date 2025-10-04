import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Rating from '@/models/Rating';
import User from '@/models/User';
import { getAuthOptions } from '@/lib/auth';

// GET /api/workers/:id/reviews - Get reviews for a specific worker
export async function GET(request, { params }) {
    try {
        const workerId = params.id;

        if (!workerId) {
            return NextResponse.json({ error: 'Worker ID required' }, { status: 400 });
        }

        await connectDB();

        // Verify worker exists
        const worker = await User.findOne({ _id: workerId, role: 'worker' });
        if (!worker) {
            return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
        }

        // Get all public, non-reported reviews
        const reviews = await Rating.find({
            worker: workerId,
            isPublic: true,
            isReported: false
        })
            .populate('patient', 'name profileImage')
            .populate('appointment', 'title scheduledDate appointmentType')
            .sort({ createdAt: -1 })
            .limit(50);

        // Calculate rating statistics
        const allRatings = await Rating.find({ worker: workerId });

        const stats = {
            avgRating: worker.avgRating || 0,
            totalReviews: worker.reviewCount || 0,
            ratingDistribution: {
                5: allRatings.filter(r => r.rating === 5).length,
                4: allRatings.filter(r => r.rating === 4).length,
                3: allRatings.filter(r => r.rating === 3).length,
                2: allRatings.filter(r => r.rating === 2).length,
                1: allRatings.filter(r => r.rating === 1).length,
            }
        };

        return NextResponse.json({
            reviews,
            stats,
            worker: {
                id: worker._id,
                name: worker.name,
                specialization: worker.specialization,
                experience: worker.experience,
                profileImage: worker.profileImage,
                avgRating: worker.avgRating,
                reviewCount: worker.reviewCount
            }
        });

    } catch (error) {
        console.error('Get worker reviews error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
