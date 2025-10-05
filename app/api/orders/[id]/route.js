import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Notification from '@/models/Notification';
import { getAuthOptions } from '@/lib/auth';

// GET /api/orders/[id] - Get single order
export async function GET(request, { params }) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orderId = params.id;

        await connectDB();

        const order = await Order.findById(orderId)
            .populate('patient', 'name email phone')
            .populate('items.medicine', 'name category images')
            .populate('items.seller', 'name shopName phone');

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Check authorization
        const isPatient = session.user.id === order.patient._id.toString();
        const isSeller = order.items.some(item =>
            item.seller._id.toString() === session.user.id
        );

        if (!isPatient && !isSeller) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ order });

    } catch (error) {
        console.error('Get order error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/orders/[id] - Update order status (Seller or Patient)
export async function PUT(request, { params }) {
    try {
        const authOptions = await getAuthOptions();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orderId = params.id;
        const { status, trackingNumber, sellerNotes, cancellationReason } = await request.json();

        await connectDB();

        const order = await Order.findById(orderId);

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Check authorization
        const isPatient = session.user.id === order.patient.toString();
        const isSeller = order.items.some(item =>
            item.seller.toString() === session.user.id
        );

        if (!isPatient && !isSeller) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Patient can only cancel pending orders
        if (isPatient && status === 'cancelled') {
            if (!['pending', 'confirmed', 'prescription_pending'].includes(order.status)) {
                return NextResponse.json({
                    error: 'Cannot cancel order at this stage'
                }, { status: 400 });
            }

            order.status = 'cancelled';
            order.cancellationReason = cancellationReason || 'Cancelled by customer';
            order.cancelledBy = session.user.id;
            order.cancelledAt = new Date();
        }
        // Seller can update status to specific stages
        else if (isSeller && status) {
            const allowedTransitions = {
                'prescription_pending': ['prescription_verified', 'cancelled'],
                'confirmed': ['processing', 'cancelled'],
                'prescription_verified': ['processing'],
                'processing': ['packed'],
                'packed': ['shipped'],
                'shipped': ['out_for_delivery'],
                'out_for_delivery': ['delivered']
            };

            if (allowedTransitions[order.status]?.includes(status)) {
                order.status = status;

                if (status === 'delivered') {
                    order.deliveredAt = new Date();
                }

                if (trackingNumber) {
                    order.trackingNumber = trackingNumber;
                }

                if (sellerNotes) {
                    order.sellerNotes = sellerNotes;
                }
            } else {
                return NextResponse.json({
                    error: 'Invalid status transition'
                }, { status: 400 });
            }
        } else {
            return NextResponse.json({ error: 'Invalid update' }, { status: 400 });
        }

        await order.save();

        // Create notification for the other party
        const notificationRecipient = isSeller ? order.patient : order.items[0].seller;
        const statusMessages = {
            'cancelled': 'Your order has been cancelled',
            'prescription_verified': 'Your prescription has been verified',
            'processing': 'Your order is being processed',
            'packed': 'Your order has been packed',
            'shipped': 'Your order has been shipped',
            'out_for_delivery': 'Your order is out for delivery',
            'delivered': 'Your order has been delivered'
        };

        if (statusMessages[status]) {
            await Notification.create({
                recipient: notificationRecipient,
                sender: session.user.id,
                title: 'Order Status Update',
                message: `Order #${order.orderNumber}: ${statusMessages[status]}`,
                type: 'order',
                relatedId: order._id
            });
        }

        // Populate and return
        const updatedOrder = await Order.findById(orderId)
            .populate('patient', 'name email phone')
            .populate('items.medicine', 'name category')
            .populate('items.seller', 'name shopName');

        return NextResponse.json({
            order: updatedOrder,
            message: 'Order updated successfully'
        });

    } catch (error) {
        console.error('Update order error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
