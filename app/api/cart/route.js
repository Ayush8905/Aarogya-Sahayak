import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Cart from '@/models/Cart';
import Medicine from '@/models/Medicine';
import { getAuthOptions } from '@/lib/auth';

// GET /api/cart - Get user's cart
export async function GET(request) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        let cart = await Cart.findOne({ patient: session.user.id })
            .populate({
                path: 'items.medicine',
                populate: {
                    path: 'seller',
                    select: 'name shopName'
                }
            });

        if (!cart) {
            // Create empty cart if doesn't exist
            cart = await Cart.create({
                patient: session.user.id,
                items: []
            });
        }

        return NextResponse.json({ cart });

    } catch (error) {
        console.error('Get cart error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/cart - Add item to cart
export async function POST(request) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'patient') {
            return NextResponse.json({ error: 'Unauthorized - Patients only' }, { status: 401 });
        }

        const { medicineId, quantity = 1 } = await request.json();

        if (!medicineId || quantity < 1) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        await connectDB();

        // Verify medicine exists and is available
        const medicine = await Medicine.findById(medicineId);

        if (!medicine || !medicine.isActive) {
            return NextResponse.json({ error: 'Medicine not available' }, { status: 404 });
        }

        if (medicine.stockQuantity < quantity) {
            return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
        }

        // Check if medicine is expired
        if (new Date(medicine.expiryDate) < new Date()) {
            return NextResponse.json({ error: 'Medicine is expired' }, { status: 400 });
        }

        // Find or create cart
        let cart = await Cart.findOne({ patient: session.user.id });

        if (!cart) {
            cart = new Cart({
                patient: session.user.id,
                items: []
            });
        }

        // Check if medicine already in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.medicine.toString() === medicineId
        );

        if (existingItemIndex > -1) {
            // Update quantity
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;

            if (newQuantity > medicine.stockQuantity) {
                return NextResponse.json({
                    error: `Only ${medicine.stockQuantity} units available`
                }, { status: 400 });
            }

            cart.items[existingItemIndex].quantity = newQuantity;
            cart.items[existingItemIndex].price = medicine.price;
            cart.items[existingItemIndex].finalPrice = medicine.finalPrice;
        } else {
            // Add new item
            cart.items.push({
                medicine: medicineId,
                quantity,
                price: medicine.price,
                finalPrice: medicine.finalPrice
            });
        }

        await cart.save();

        // Populate and return cart
        cart = await Cart.findById(cart._id)
            .populate({
                path: 'items.medicine',
                populate: {
                    path: 'seller',
                    select: 'name shopName'
                }
            });

        return NextResponse.json({
            cart,
            message: 'Item added to cart'
        });

    } catch (error) {
        console.error('Add to cart error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/cart - Update cart item quantity
export async function PUT(request) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'patient') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { medicineId, quantity } = await request.json();

        if (!medicineId || quantity < 0) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        await connectDB();

        const cart = await Cart.findOne({ patient: session.user.id });

        if (!cart) {
            return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
        }

        const itemIndex = cart.items.findIndex(
            item => item.medicine.toString() === medicineId
        );

        if (itemIndex === -1) {
            return NextResponse.json({ error: 'Item not in cart' }, { status: 404 });
        }

        if (quantity === 0) {
            // Remove item
            cart.items.splice(itemIndex, 1);
        } else {
            // Verify stock availability
            const medicine = await Medicine.findById(medicineId);

            if (!medicine || !medicine.isActive) {
                return NextResponse.json({ error: 'Medicine not available' }, { status: 404 });
            }

            if (medicine.stockQuantity < quantity) {
                return NextResponse.json({
                    error: `Only ${medicine.stockQuantity} units available`
                }, { status: 400 });
            }

            // Update quantity
            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].price = medicine.price;
            cart.items[itemIndex].finalPrice = medicine.finalPrice;
        }

        await cart.save();

        // Populate and return cart
        const updatedCart = await Cart.findById(cart._id)
            .populate({
                path: 'items.medicine',
                populate: {
                    path: 'seller',
                    select: 'name shopName'
                }
            });

        return NextResponse.json({
            cart: updatedCart,
            message: 'Cart updated'
        });

    } catch (error) {
        console.error('Update cart error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/cart - Clear cart
export async function DELETE(request) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        await Cart.findOneAndUpdate(
            { patient: session.user.id },
            { items: [], totalItems: 0, subtotal: 0 }
        );

        return NextResponse.json({
            message: 'Cart cleared'
        });

    } catch (error) {
        console.error('Clear cart error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
