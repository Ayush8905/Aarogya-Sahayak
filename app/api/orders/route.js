import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import Medicine from '@/models/Medicine';
import Notification from '@/models/Notification';
import { getAuthOptions } from '@/lib/auth';

// GET /api/orders - Get user's orders
export async function GET(request) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        await connectDB();

        let query = {};

        if (session.user.role === 'patient') {
            query.patient = session.user.id;
        } else if (session.user.role === 'seller') {
            // Get orders containing seller's medicines
            query['items.seller'] = session.user.id;
        } else {
            return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
        }

        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('patient', 'name email phone')
            .populate('items.medicine', 'name category')
            .populate('items.seller', 'name shopName')
            .sort({ createdAt: -1 });

        return NextResponse.json({ orders });

    } catch (error) {
        console.error('Get orders error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/orders - Create new order (Patient only)
export async function POST(request) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'patient') {
            return NextResponse.json({ error: 'Unauthorized - Patients only' }, { status: 401 });
        }

        const { deliveryAddress, paymentMethod = 'cod' } = await request.json();

        // Validate delivery address
        if (!deliveryAddress || !deliveryAddress.fullName || !deliveryAddress.phone ||
            !deliveryAddress.addressLine1 || !deliveryAddress.city ||
            !deliveryAddress.state || !deliveryAddress.pincode) {
            return NextResponse.json({ error: 'Complete delivery address required' }, { status: 400 });
        }

        await connectDB();

        // Get user's cart
        const cart = await Cart.findOne({ patient: session.user.id })
            .populate('items.medicine');

        if (!cart || cart.items.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        // Validate stock and build order items
        let subtotal = 0;
        let prescriptionRequired = false;
        const orderItems = [];

        for (const item of cart.items) {
            const medicine = item.medicine;

            if (!medicine || !medicine.isActive) {
                return NextResponse.json({
                    error: `Medicine ${medicine?.name || 'unknown'} is not available`
                }, { status: 400 });
            }

            if (medicine.stockQuantity < item.quantity) {
                return NextResponse.json({
                    error: `Insufficient stock for ${medicine.name}`
                }, { status: 400 });
            }

            if (new Date(medicine.expiryDate) < new Date()) {
                return NextResponse.json({
                    error: `Medicine ${medicine.name} is expired`
                }, { status: 400 });
            }

            if (medicine.requiresPrescription) {
                prescriptionRequired = true;
            }

            orderItems.push({
                medicine: medicine._id,
                medicineName: medicine.name,
                quantity: item.quantity,
                price: item.price,
                finalPrice: item.finalPrice,
                seller: medicine.seller
            });

            subtotal += item.finalPrice * item.quantity;
        }

        // Calculate delivery charges (free above ₹500)
        const deliveryCharges = subtotal >= 500 ? 0 : 50;
        const totalAmount = subtotal + deliveryCharges;

        // Create order
        const order = await Order.create({
            patient: session.user.id,
            items: orderItems,
            deliveryAddress,
            subtotal,
            deliveryCharges,
            totalAmount,
            prescriptionRequired,
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
            status: prescriptionRequired ? 'prescription_pending' : 'confirmed',
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        // Update medicine stock and sales
        for (const item of cart.items) {
            await Medicine.findByIdAndUpdate(item.medicine._id, {
                $inc: {
                    stockQuantity: -item.quantity,
                    totalSold: item.quantity
                }
            });
        }

        // Clear cart
        await Cart.findByIdAndUpdate(cart._id, {
            items: [],
            totalItems: 0,
            subtotal: 0
        });

        // Create notifications for sellers
        const uniqueSellers = [...new Set(orderItems.map(item => item.seller.toString()))];

        for (const sellerId of uniqueSellers) {
            await Notification.create({
                recipient: sellerId,
                sender: session.user.id,
                title: 'New Order Received',
                message: `You have received a new order #${order.orderNumber}`,
                type: 'order',
                relatedId: order._id
            });
        }

        // Populate order before returning
        const populatedOrder = await Order.findById(order._id)
            .populate('items.medicine', 'name category')
            .populate('items.seller', 'name shopName');

        return NextResponse.json({
            order: populatedOrder,
            message: 'Order placed successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Create order error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
