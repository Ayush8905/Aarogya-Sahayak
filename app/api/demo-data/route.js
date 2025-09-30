import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({
        message: 'Demo data creation endpoint',
        demoUsers: [
            {
                id: 'demo-patient-1',
                name: 'John Patient',
                email: 'patient1@demo.com',
                role: 'patient',
                phone: '123-456-7890'
            },
            {
                id: 'demo-worker-1',
                name: 'Dr. Sarah Wilson',
                email: 'doctor1@demo.com',
                role: 'worker',
                specialization: 'General Medicine',
                phone: '098-765-4321'
            },
            {
                id: 'demo-worker-2',
                name: 'Dr. Michael Brown',
                email: 'doctor2@demo.com',
                role: 'worker',
                specialization: 'Pediatrics',
                phone: '555-123-4567'
            }
        ],
        instructions: [
            '1. Use demo@example.com / demo123 to login',
            '2. You can chat with any of the demo users above',
            '3. The system works with mock data when database is offline',
            '4. Real-time messaging is enabled via Socket.io'
        ]
    });
}