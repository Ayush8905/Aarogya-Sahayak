import mongoose from 'mongoose';

const RatingSchema = new mongoose.Schema({
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true,
        unique: true // One rating per appointment
    },
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
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    isPublic: {
        type: Boolean,
        default: true // User can choose to make review private
    },
    isReported: {
        type: Boolean,
        default: false
    },
    reportReason: {
        type: String,
        trim: true
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reportedAt: {
        type: Date
    },
    workerResponse: {
        type: String,
        trim: true,
        maxlength: 500
    },
    respondedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
RatingSchema.index({ worker: 1, createdAt: -1 });
RatingSchema.index({ patient: 1 });
RatingSchema.index({ appointment: 1 });
RatingSchema.index({ isPublic: 1, isReported: 1 });

export default mongoose.models.Rating || mongoose.model('Rating', RatingSchema);
