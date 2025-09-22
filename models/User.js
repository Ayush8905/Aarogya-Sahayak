import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['patient', 'worker'],
        required: true
    },
    phone: {
        type: String,
        trim: true
    },
    profileImage: {
        type: String,
        default: ''
    },
    // For health workers
    specialization: {
        type: String,
        trim: true
    },
    experience: {
        type: Number,
        min: 0
    },
    availableHours: {
        start: String,
        end: String
    },
    // For patients
    age: {
        type: Number,
        min: 0
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    medicalHistory: [{
        condition: String,
        date: Date,
        notes: String
    }],
    // Worker-Patient assignments
    assignedWorkers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    assignedPatients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Ensure we don't create duplicate models
export default mongoose.models.User || mongoose.model('User', UserSchema);