import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import { getAuthOptions } from '@/lib/auth';

// GET /api/medicines - Get all medicines with filters
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const category = searchParams.get('category');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const order = searchParams.get('order') || 'desc';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const sellerId = searchParams.get('sellerId');

        await connectDB();

        // Build query
        let query = { isActive: true };

        // Search by name, generic name, or manufacturer
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { genericName: { $regex: search, $options: 'i' } },
                { manufacturer: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by category
        if (category && category !== 'all') {
            query.category = category;
        }

        // Filter by price range
        if (minPrice || maxPrice) {
            query.finalPrice = {};
            if (minPrice) query.finalPrice.$gte = parseFloat(minPrice);
            if (maxPrice) query.finalPrice.$lte = parseFloat(maxPrice);
        }

        // Filter by seller
        if (sellerId) {
            query.seller = sellerId;
        }

        // Check if medicine is not expired
        query.expiryDate = { $gte: new Date() };

        // Count total documents
        const total = await Medicine.countDocuments(query);

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = order === 'asc' ? 1 : -1;

        // Get medicines with pagination
        const medicines = await Medicine.find(query)
            .populate('seller', 'name shopName email phone')
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(limit);

        return NextResponse.json({
            medicines,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get medicines error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/medicines - Add new medicine (Seller only)
export async function POST(request) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'seller') {
            return NextResponse.json({ error: 'Unauthorized - Sellers only' }, { status: 401 });
        }

        const data = await request.json();

        // Validation
        const {
            name,
            manufacturer,
            category,
            price,
            stockQuantity,
            unit,
            expiryDate,
            requiresPrescription,
            description,
            genericName,
            dosageForm,
            strength,
            discountPercentage,
            unitsPerPack,
            sideEffects,
            usage,
            storage,
            imageUrl
        } = data;

        if (!name || !manufacturer || !category || !price || stockQuantity === undefined || !unit || !expiryDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (price < 0) {
            return NextResponse.json({ error: 'Price cannot be negative' }, { status: 400 });
        }

        if (stockQuantity < 0) {
            return NextResponse.json({ error: 'Stock quantity cannot be negative' }, { status: 400 });
        }

        // Check expiry date is in future
        if (new Date(expiryDate) < new Date()) {
            return NextResponse.json({ error: 'Expiry date must be in the future' }, { status: 400 });
        }

        await connectDB();

        // Create medicine
        const medicine = await Medicine.create({
            name,
            genericName,
            manufacturer,
            category,
            description,
            price,
            discountPercentage: discountPercentage || 0,
            stockQuantity,
            unit,
            unitsPerPack: unitsPerPack || 1,
            expiryDate,
            requiresPrescription: requiresPrescription || false,
            images: imageUrl ? [imageUrl] : [],
            dosageForm,
            strength,
            sideEffects,
            usage,
            storage,
            seller: session.user.id,
            isActive: true,
            isVerified: false
        });

        const populatedMedicine = await Medicine.findById(medicine._id)
            .populate('seller', 'name shopName email');

        return NextResponse.json({
            medicine: populatedMedicine,
            message: 'Medicine added successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Create medicine error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
