import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import { getAuthOptions } from '@/lib/auth';

// GET /api/medicines/[id] - Get single medicine
export async function GET(request, { params }) {
    try {
        const medicineId = params.id;

        await connectDB();

        const medicine = await Medicine.findById(medicineId)
            .populate('seller', 'name shopName email phone shopAddress');

        if (!medicine) {
            return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
        }

        // Increment view count
        medicine.viewCount += 1;
        await medicine.save();

        return NextResponse.json({ medicine });

    } catch (error) {
        console.error('Get medicine error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/medicines/[id] - Update medicine (Seller only - own medicines)
export async function PUT(request, { params }) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'seller') {
            return NextResponse.json({ error: 'Unauthorized - Sellers only' }, { status: 401 });
        }

        const medicineId = params.id;
        const updates = await request.json();

        await connectDB();

        // Find medicine
        const medicine = await Medicine.findById(medicineId);

        if (!medicine) {
            return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
        }

        // Check if seller owns this medicine
        if (medicine.seller.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden - You can only update your own medicines' }, { status: 403 });
        }

        // Update allowed fields
        const allowedFields = [
            'name', 'genericName', 'manufacturer', 'category', 'description',
            'price', 'discountPercentage', 'stockQuantity', 'unit', 'unitsPerPack',
            'expiryDate', 'requiresPrescription', 'dosageForm', 'strength',
            'sideEffects', 'usage', 'storage', 'isActive'
        ];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                medicine[field] = updates[field];
            }
        });

        // Handle image update
        if (updates.imageUrl !== undefined) {
            medicine.images = updates.imageUrl ? [updates.imageUrl] : [];
        }

        await medicine.save();

        const updatedMedicine = await Medicine.findById(medicineId)
            .populate('seller', 'name shopName email');

        return NextResponse.json({
            medicine: updatedMedicine,
            message: 'Medicine updated successfully'
        });

    } catch (error) {
        console.error('Update medicine error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/medicines/[id] - Delete medicine (Seller only - own medicines)
export async function DELETE(request, { params }) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'seller') {
            return NextResponse.json({ error: 'Unauthorized - Sellers only' }, { status: 401 });
        }

        const medicineId = params.id;

        await connectDB();

        // Find medicine
        const medicine = await Medicine.findById(medicineId);

        if (!medicine) {
            return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
        }

        // Check if seller owns this medicine
        if (medicine.seller.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden - You can only delete your own medicines' }, { status: 403 });
        }

        // Soft delete - mark as inactive
        medicine.isActive = false;
        await medicine.save();

        return NextResponse.json({
            message: 'Medicine deleted successfully'
        });

    } catch (error) {
        console.error('Delete medicine error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
