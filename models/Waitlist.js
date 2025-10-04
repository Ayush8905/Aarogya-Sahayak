import mongoose from 'mongoose';

const WaitlistSchema = new mongoose.Schema({
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
    preferredDate: {
        type: Date,
        required: true
    },
    preferredTimeSlot: {
        type: String,
        enum: ['morning', 'afternoon', 'evening', 'any'],
        default: 'any'
    },
    appointmentType: {
        type: String,
        enum: ['consultation', 'checkup', 'emergency', 'follow-up'],
        required: true
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['waiting', 'notified', 'booked', 'expired', 'cancelled'],
        default: 'waiting'
    },
    priority: {
        type: Number,
        default: 0 // Higher number = higher priority
    },
    notifiedAt: {
        type: Date
    },
    expiresAt: {
        type: Date,
        required: true
    },
    bookedAppointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
WaitlistSchema.index({ worker: 1, status: 1, priority: -1, createdAt: 1 });
WaitlistSchema.index({ patient: 1, status: 1 });
WaitlistSchema.index({ expiresAt: 1 }); // For cleanup jobs

// Compound index to prevent duplicate active waitlist entries
WaitlistSchema.index({
    patient: 1,
    worker: 1,
    status: 1
}, {
    unique: true,
    partialFilterExpression: { status: { $in: ['waiting', 'notified'] } }
});

export default mongoose.models.Waitlist || mongoose.model('Waitlist', WaitlistSchema);
