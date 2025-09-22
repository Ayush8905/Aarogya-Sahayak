import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { name, email, password, role, phone, specialization, experience, age, gender } = await request.json();

        // Validation
        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (!['patient', 'worker'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists with this email' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user object
        const userData = {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            phone,
            isActive: true
        };

        // Add role-specific fields
        if (role === 'worker') {
            userData.specialization = specialization;
            userData.experience = experience || 0;
            userData.assignedPatients = [];
        } else if (role === 'patient') {
            userData.age = age;
            userData.gender = gender;
            userData.assignedWorkers = [];
            userData.medicalHistory = [];
        }

        // Create user
        const user = new User(userData);
        await user.save();

        // Remove password from response
        const { password: _, ...userResponse } = user.toObject();

        return NextResponse.json(
            {
                message: 'User created successfully',
                user: userResponse
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}