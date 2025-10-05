import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Import models
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found in environment variables');
        }

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
            socketTimeoutMS: 15000,
            family: 4,
            maxPoolSize: 10,
            retryWrites: true,
            w: 'majority'
        });

        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await User.deleteMany({});
        await Appointment.deleteMany({});
        await Notification.deleteMany({});
        await Message.deleteMany({});

        // Create sample users
        console.log('👥 Creating sample users...');

        // Hash password for all users
        const hashedPassword = await bcrypt.hash('123456', 12);

        // Create healthcare workers
        const workers = await User.create([
            {
                name: 'Dr. Rajesh Kumar',
                email: 'rajesh.kumar@aarogya.com',
                password: hashedPassword,
                role: 'worker',
                phone: '+91-9876543210',
                specialization: 'General Medicine',
                experience: 15,
                availableHours: { start: '09:00', end: '17:00' },
                profileImage: null
            },
            {
                name: 'Dr. Priya Sharma',
                email: 'priya.sharma@aarogya.com',
                password: hashedPassword,
                role: 'worker',
                phone: '+91-9876543211',
                specialization: 'Pediatrics',
                experience: 12,
                availableHours: { start: '08:00', end: '16:00' },
                profileImage: null
            },
            {
                name: 'Dr. Amit Patel',
                email: 'amit.patel@aarogya.com',
                password: hashedPassword,
                role: 'worker',
                phone: '+91-9876543212',
                specialization: 'Cardiology',
                experience: 20,
                availableHours: { start: '10:00', end: '18:00' },
                profileImage: null
            },
            {
                name: 'Dr. Sunita Verma',
                email: 'sunita.verma@aarogya.com',
                password: hashedPassword,
                role: 'worker',
                phone: '+91-9876543213',
                specialization: 'Gynecology',
                experience: 18,
                availableHours: { start: '09:00', end: '17:00' },
                profileImage: null
            }
        ]);

        // Create sample patients
        const patients = await User.create([
            {
                name: 'Ayush',
                email: 'a@gmail.com',
                password: hashedPassword,
                role: 'patient',
                phone: '+91-9876543220',
                age: 28,
                gender: 'male',
                medicalHistory: [
                    {
                        condition: 'Hypertension',
                        date: new Date('2023-01-15'),
                        notes: 'Controlled with medication'
                    }
                ]
            },
            {
                name: 'Ravi Singh',
                email: 'ravi.singh@example.com',
                password: hashedPassword,
                role: 'patient',
                phone: '+91-9876543221',
                age: 35,
                gender: 'male',
                medicalHistory: []
            },
            {
                name: 'Anita Gupta',
                email: 'anita.gupta@example.com',
                password: hashedPassword,
                role: 'patient',
                phone: '+91-9876543222',
                age: 42,
                gender: 'female',
                medicalHistory: [
                    {
                        condition: 'Diabetes Type 2',
                        date: new Date('2022-05-10'),
                        notes: 'Regular monitoring required'
                    }
                ]
            }
        ]);

        console.log(`✅ Created ${workers.length} healthcare workers`);
        console.log(`✅ Created ${patients.length} patients`);

        // Create sample medicine sellers
        const sellers = await User.create([
            {
                name: 'MedPlus Pharmacy',
                email: 'seller@medplus.com',
                password: hashedPassword,
                role: 'seller',
                phone: '+91-9876543230'
            },
            {
                name: 'Apollo Pharmacy',
                email: 'seller@apollo.com',
                password: hashedPassword,
                role: 'seller',
                phone: '+91-9876543231'
            }
        ]);

        console.log(`✅ Created ${sellers.length} medicine sellers`);

        // Create sample appointments
        console.log('📅 Creating sample appointments...');

        const appointments = await Appointment.create([
            // Completed appointments (for testing rating feature)
            {
                patient: patients[0]._id, // Ayush
                worker: workers[0]._id,   // Dr. Rajesh Kumar
                title: 'General Health Checkup - COMPLETED',
                description: 'Routine health examination and blood pressure monitoring',
                scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                duration: 30,
                status: 'completed', // COMPLETED - Can be rated!
                appointmentType: 'checkup',
                notes: 'Patient has history of hypertension. Checkup completed successfully.',
                hasRating: false // Not yet rated
            },
            {
                patient: patients[0]._id, // Ayush
                worker: workers[1]._id,   // Dr. Priya Sharma
                title: 'Consultation - COMPLETED',
                description: 'General health consultation',
                scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                duration: 45,
                status: 'completed', // COMPLETED - Can be rated!
                appointmentType: 'consultation',
                notes: 'General consultation completed.',
                hasRating: false // Not yet rated
            },
            {
                patient: patients[1]._id, // Ravi Singh
                worker: workers[2]._id,   // Dr. Amit Patel
                title: 'Cardiology Checkup - COMPLETED',
                description: 'Heart health screening',
                scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                duration: 60,
                status: 'completed', // COMPLETED - Can be rated!
                appointmentType: 'checkup',
                notes: 'Cardiac screening completed. All vitals normal.',
                hasRating: false // Not yet rated
            },
            // Upcoming appointments
            {
                patient: patients[0]._id, // Ayush
                worker: workers[0]._id,   // Dr. Rajesh Kumar
                title: 'Follow-up Checkup',
                description: 'Follow-up health examination',
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                duration: 30,
                status: 'approved',
                appointmentType: 'follow-up',
                notes: 'Follow-up for previous checkup'
            },
            {
                patient: patients[1]._id, // Ravi Singh
                worker: workers[1]._id,   // Dr. Priya Sharma
                title: 'Pediatric Consultation',
                description: 'Consultation for child health',
                scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
                duration: 45,
                status: 'pending',
                appointmentType: 'consultation',
                notes: 'New patient consultation'
            },
            {
                patient: patients[2]._id, // Anita Gupta
                worker: workers[2]._id,   // Dr. Amit Patel
                title: 'Cardiology Follow-up',
                description: 'Follow-up for heart health monitoring',
                scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                duration: 60,
                status: 'pending',
                appointmentType: 'follow-up',
                notes: 'Patient with diabetes, cardiac screening required'
            }
        ]);

        console.log(`✅ Created ${appointments.length} appointments (${appointments.filter(a => a.status === 'completed').length} completed, ready to rate)`);

        // Create sample notifications
        console.log('🔔 Creating sample notifications...');

        const notifications = await Notification.create([
            {
                recipient: patients[0]._id,
                sender: workers[0]._id,
                title: 'Appointment Confirmed',
                message: 'Your appointment with Dr. Rajesh Kumar has been confirmed for tomorrow at 10:00 AM',
                type: 'appointment',
                relatedId: appointments[0]._id
            },
            {
                recipient: patients[1]._id,
                sender: workers[1]._id,
                title: 'Appointment Approved',
                message: 'Your consultation with Dr. Priya Sharma has been approved',
                type: 'appointment',
                relatedId: appointments[1]._id
            },
            {
                recipient: workers[0]._id,
                sender: patients[0]._id,
                title: 'New Appointment Request',
                message: 'You have a new appointment request from Ayush',
                type: 'appointment',
                relatedId: appointments[0]._id
            }
        ]);

        console.log(`✅ Created ${notifications.length} notifications`);

        // Create sample messages
        console.log('💬 Creating sample messages...');

        const messages = await Message.create([
            {
                sender: patients[0]._id,
                receiver: workers[0]._id,
                content: 'Hello Doctor, I would like to schedule an appointment for my regular checkup.',
                messageType: 'text'
            },
            {
                sender: workers[0]._id,
                receiver: patients[0]._id,
                content: 'Hello Ayush, I have scheduled your appointment for tomorrow at 10:00 AM. Please bring your previous medical reports.',
                messageType: 'text',
                isRead: true,
                readAt: new Date()
            }
        ]);

        console.log(`✅ Created ${messages.length} messages`);

        console.log('🎉 Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   👨‍⚕️ Healthcare Workers: ${workers.length}`);
        console.log(`   🤒 Patients: ${patients.length}`);
        console.log(`   � Medicine Sellers: ${sellers.length}`);
        console.log(`   �📅 Appointments: ${appointments.length}`);
        console.log(`   🔔 Notifications: ${notifications.length}`);
        console.log(`   💬 Messages: ${messages.length}`);

        console.log('\n🔐 Demo Login Credentials:');
        console.log('   Patient: a@gmail.com / 123456');
        console.log('   Doctor: rajesh.kumar@aarogya.com / 123456');
        console.log('   Seller: seller@medplus.com / 123456');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

// Run the seed function
seedDatabase();