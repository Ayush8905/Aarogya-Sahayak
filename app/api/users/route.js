import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthOptions } from '@/lib/auth';

export async function GET(request) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const search = searchParams.get('search');

        const connection = await connectDB();
        if (!connection) {
            // Return mock data if database is not available
            const mockUsers = role === 'worker' ? [
                {
                    _id: 'mock1',
                    name: 'Dr. John Smith',
                    email: 'john.smith@example.com',
                    role: 'worker',
                    specialization: 'General Medicine',
                    isActive: true,
                    profileImage: null,
                    phone: '1234567890'
                },
                {
                    _id: 'mock2',
                    name: 'Dr. Sarah Johnson',
                    email: 'sarah.johnson@example.com',
                    role: 'worker',
                    specialization: 'Pediatrics',
                    isActive: true,
                    profileImage: null,
                    phone: '0987654321'
                }
            ] : [
                {
                    _id: 'mock3',
                    name: 'Alice Patient',
                    email: 'alice@example.com',
                    role: 'patient',
                    isActive: true,
                    profileImage: null,
                    phone: '5555555555'
                }
            ];

            return NextResponse.json({ users: mockUsers });
        }

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
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);
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