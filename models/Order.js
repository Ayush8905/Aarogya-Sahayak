import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    items: [{
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
            required: true
        },
        medicineName: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        },
        finalPrice: {
            type: Number,
            required: true
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    // Delivery Address
    deliveryAddress: {
        fullName: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        addressLine1: {
            type: String,
            required: true
        },
        addressLine2: String,
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        pincode: {
            type: String,
            required: true
        },
        landmark: String
    },
    // Pricing
    subtotal: {
        type: Number,
        required: true
    },
    deliveryCharges: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    // Prescription
    prescriptionRequired: {
        type: Boolean,
        default: false
    },
    prescriptionUploaded: {
        type: Boolean,
        default: false
    },
    prescriptionUrl: String,
    prescriptionVerified: {
        type: Boolean,
        default: false
    },
    // Order Status
    status: {
        type: String,
        required: true,
        enum: [
            'pending',
            'confirmed',
            'prescription_pending',
            'prescription_verified',
            'processing',
            'packed',
            'shipped',
            'out_for_delivery',
            'delivered',
            'cancelled',
            'refunded'
        ],
        default: 'pending',
        index: true
    },
    // Payment (for future implementation)
    paymentMethod: {
        type: String,
        enum: ['cod', 'online', 'wallet'],
        default: 'cod'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    // Tracking
    trackingNumber: String,
    estimatedDelivery: Date,
    deliveredAt: Date,
    // Cancellation
    cancellationReason: String,
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancelledAt: Date,
    // Notes
    orderNotes: String,
    sellerNotes: String
}, {
    timestamps: true
});

// Generate order number before saving
OrderSchema.pre('save', function (next) {
    if (!this.orderNumber) {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.orderNumber = `ORD${timestamp}${random}`;
    }
    next();
});

// Indexes for efficient querying
OrderSchema.index({ patient: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'items.seller': 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
