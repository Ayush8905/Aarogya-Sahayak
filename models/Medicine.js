import mongoose from 'mongoose';

const MedicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    genericName: {
        type: String,
        trim: true
    },
    manufacturer: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'Tablets',
            'Capsules',
            'Syrups',
            'Injections',
            'Ointments',
            'Drops',
            'Inhalers',
            'Supplements',
            'First Aid',
            'Baby Care',
            'Personal Care',
            'Ayurvedic',
            'Homeopathic',
            'Other'
        ]
    },
    description: {
        type: String,
        trim: true,
        maxlength: 2000
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discountPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    finalPrice: {
        type: Number
    },
    stockQuantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    unit: {
        type: String,
        required: true,
        enum: ['strip', 'bottle', 'box', 'tube', 'piece', 'pack']
    },
    unitsPerPack: {
        type: Number,
        default: 1
    },
    expiryDate: {
        type: Date,
        required: true
    },
    requiresPrescription: {
        type: Boolean,
        default: false
    },
    images: [{
        type: String
    }],
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Additional details
    dosageForm: {
        type: String,
        trim: true
    },
    strength: {
        type: String,
        trim: true
    },
    sideEffects: {
        type: String,
        trim: true
    },
    usage: {
        type: String,
        trim: true
    },
    storage: {
        type: String,
        trim: true
    },
    // Ratings
    avgRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    // Sales tracking
    totalSold: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Calculate final price before saving
MedicineSchema.pre('save', function (next) {
    if (this.discountPercentage > 0) {
        this.finalPrice = this.price - (this.price * this.discountPercentage / 100);
    } else {
        this.finalPrice = this.price;
    }
    next();
});

// Indexes for efficient querying
MedicineSchema.index({ name: 'text', genericName: 'text', manufacturer: 'text' });
MedicineSchema.index({ category: 1, isActive: 1 });
MedicineSchema.index({ seller: 1, isActive: 1 });
MedicineSchema.index({ price: 1 });
MedicineSchema.index({ avgRating: -1 });
MedicineSchema.index({ totalSold: -1 });
MedicineSchema.index({ expiryDate: 1 });

export default mongoose.models.Medicine || mongoose.model('Medicine', MedicineSchema);
