// Script to create a completed appointment for testing the rating feature
// Run this in MongoDB Compass or add it to seed-database.js

import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import User from '@/models/User';

async function createCompletedAppointment() {
    try {
        await connectDB();

        // Find a patient and worker
        const patient = await User.findOne({ role: 'patient' });
        const worker = await User.findOne({ role: 'worker' });

        if (!patient || !worker) {
            console.log('Please create patient and worker users first');
            return;
        }

        // Create a completed appointment
        const appointment = await Appointment.create({
            patient: patient._id,
            worker: worker._id,
            title: 'General Checkup',
            description: 'Regular health checkup',
            scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
            duration: 30,
            status: 'completed', // Mark as completed so it can be rated
            appointmentType: 'consultation',
            hasRating: false, // Not yet rated
            notes: 'Patient came for routine checkup. All vitals normal.'
        });

        console.log('✅ Created completed appointment:', {
            id: appointment._id,
            patient: patient.name,
            worker: worker.name,
            status: appointment.status,
            date: appointment.scheduledDate
        });

        console.log('\n📝 Now you can:');
        console.log('1. Login as patient:', patient.email);
        console.log('2. Go to Appointments page');
        console.log('3. Find the completed appointment');
        console.log('4. Click "⭐ Rate Appointment"');
        console.log('5. Submit your rating');

    } catch (error) {
        console.error('Error creating completed appointment:', error);
    }
}

// If running directly
if (require.main === module) {
    createCompletedAppointment()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export default createCompletedAppointment;
