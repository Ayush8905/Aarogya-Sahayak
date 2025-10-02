import mongoose from 'mongoose';

const videoConsultationSchema = new mongoose.Schema({
    consultationId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    scheduledTime: {
        type: Date,
        required: true
    },
    actualStartTime: {
        type: Date
    },
    actualEndTime: {
        type: Date
    },
    duration: {
        type: Number, // in minutes
        default: 0
    },
    status: {
        type: String,
        enum: ['scheduled', 'waiting', 'in-progress', 'completed', 'cancelled', 'no-show'],
        default: 'scheduled'
    },
    callType: {
        type: String,
        enum: ['video', 'audio-only', 'screen-share'],
        default: 'video'
    },
    roomId: {
        type: String,
        required: true
    },
    participantJoined: {
        patient: {
            type: Boolean,
            default: false
        },
        doctor: {
            type: Boolean,
            default: false
        }
    },
    callQuality: {
        patient: {
            video: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' },
            audio: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' },
            connection: { type: String, enum: ['stable', 'unstable', 'poor'], default: 'stable' }
        },
        doctor: {
            video: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' },
            audio: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' },
            connection: { type: String, enum: ['stable', 'unstable', 'poor'], default: 'stable' }
        }
    },
    recordingEnabled: {
        type: Boolean,
        default: false
    },
    recordingUrl: {
        type: String
    },
    notes: {
        type: String
    },
    prescription: {
        type: String
    },
    followUpRequired: {
        type: Boolean,
        default: false
    },
    followUpDate: {
        type: Date
    },
    technicalIssues: [{
        timestamp: Date,
        issue: String,
        resolved: { type: Boolean, default: false }
    }],
    consultation: {
        symptoms: [String],
        diagnosis: String,
        recommendations: [String],
        medications: [{
            name: String,
            dosage: String,
            frequency: String,
            duration: String
        }]
    }
}, {
    timestamps: true
});

// Indexes for better query performance
videoConsultationSchema.index({ consultationId: 1 });
videoConsultationSchema.index({ patient: 1 });
videoConsultationSchema.index({ doctor: 1 });
videoConsultationSchema.index({ scheduledTime: 1 });
videoConsultationSchema.index({ status: 1 });

// Virtual for consultation duration in formatted string
videoConsultationSchema.virtual('formattedDuration').get(function () {
    if (this.duration < 60) {
        return `${this.duration} minutes`;
    }
    const hours = Math.floor(this.duration / 60);
    const minutes = this.duration % 60;
    return `${hours}h ${minutes}m`;
});

// Method to generate unique room ID
videoConsultationSchema.statics.generateRoomId = function () {
    return 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Method to start consultation
videoConsultationSchema.methods.startConsultation = function () {
    this.status = 'in-progress';
    this.actualStartTime = new Date();
    return this.save();
};

// Method to end consultation
videoConsultationSchema.methods.endConsultation = function () {
    this.status = 'completed';
    this.actualEndTime = new Date();
    if (this.actualStartTime) {
        this.duration = Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60));
    }
    return this.save();
};

// Indexes for efficient querying (consultationId already has unique index)
videoConsultationSchema.index({ patient: 1, scheduledTime: -1 });
videoConsultationSchema.index({ doctor: 1, scheduledTime: -1 });
videoConsultationSchema.index({ status: 1 });

export default mongoose.models.VideoConsultation || mongoose.model('VideoConsultation', videoConsultationSchema);