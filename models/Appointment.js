import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // in minutes
        default: 30
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
        default: 'pending'
    },
    appointmentType: {
        type: String,
        enum: ['consultation', 'checkup', 'emergency', 'follow-up'],
        required: true
    },
    notes: {
        type: String,
        trim: true
    },
    // For reminders
    reminderSent: {
        type: Boolean,
        default: false
    },
    reminderDate: {
        type: Date
    },
    // Worker response
    workerResponse: {
        message: String,
        respondedAt: Date
    }
}, {
    timestamps: true
});

// Index for efficient querying
AppointmentSchema.index({ patient: 1, worker: 1, scheduledDate: 1 });
AppointmentSchema.index({ status: 1, scheduledDate: 1 });

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);