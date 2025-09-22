import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const search = searchParams.get('search');

        await connectDB();

        let query = { isActive: true };

        if (role) {
            query.role = role;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { specialization: { $regex: search, $options: 'i' } }
            ];
        }

        // Exclude current user and exclude passwords
        const users = await User.find({
            ...query,
            _id: { $ne: session.user.id }
        }).select('-password');

        return NextResponse.json({ users });

    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, targetUserId } = await request.json();

        if (!action || !targetUserId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        const currentUser = await User.findById(session.user.id);
        const targetUser = await User.findById(targetUserId);

        if (!currentUser || !targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (action === 'assign') {
            // Assign worker to patient or patient to worker
            if (currentUser.role === 'patient' && targetUser.role === 'worker') {
                if (!currentUser.assignedWorkers.includes(targetUserId)) {
                    currentUser.assignedWorkers.push(targetUserId);
                    await currentUser.save();
                }
                if (!targetUser.assignedPatients.includes(session.user.id)) {
                    targetUser.assignedPatients.push(session.user.id);
                    await targetUser.save();
                }
            } else if (currentUser.role === 'worker' && targetUser.role === 'patient') {
                if (!currentUser.assignedPatients.includes(targetUserId)) {
                    currentUser.assignedPatients.push(targetUserId);
                    await currentUser.save();
                }
                if (!targetUser.assignedWorkers.includes(session.user.id)) {
                    targetUser.assignedWorkers.push(session.user.id);
                    await targetUser.save();
                }
            } else {
                return NextResponse.json({ error: 'Invalid assignment' }, { status: 400 });
            }
        } else if (action === 'unassign') {
            // Remove assignment
            currentUser.assignedWorkers = currentUser.assignedWorkers.filter(
                id => id.toString() !== targetUserId
            );
            currentUser.assignedPatients = currentUser.assignedPatients.filter(
                id => id.toString() !== targetUserId
            );
            await currentUser.save();

            targetUser.assignedWorkers = targetUser.assignedWorkers.filter(
                id => id.toString() !== session.user.id
            );
            targetUser.assignedPatients = targetUser.assignedPatients.filter(
                id => id.toString() !== session.user.id
            );
            await targetUser.save();
        }

        return NextResponse.json({ message: 'Assignment updated successfully' });

    } catch (error) {
        console.error('Update assignment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}