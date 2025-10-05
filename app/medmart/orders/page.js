'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OrdersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session || session.user.role !== 'patient') {
            router.push('/auth/signin');
            return;
        }
        fetchOrders();
    }, [session, status]);

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/orders');
            if (response.ok) {
                const data = await response.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'confirmed': 'bg-blue-100 text-blue-800',
            'prescription_pending': 'bg-orange-100 text-orange-800',
            'processing': 'bg-purple-100 text-purple-800',
            'shipped': 'bg-indigo-100 text-indigo-800',
            'delivered': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusText = (status) => {
        const texts = {
            'pending': '⏳ Pending',
            'confirmed': '✅ Confirmed',
            'prescription_pending': '📋 Prescription Pending',
            'processing': '⚙️ Processing',
            'shipped': '🚚 Shipped',
            'delivered': '📦 Delivered',
            'cancelled': '❌ Cancelled'
        };
        return texts[status] || status;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/medmart">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent hover:opacity-80 cursor-pointer">
                                ← My Orders
                            </h1>
                        </Link>
                        <div className="flex gap-4">
                            <Link href="/medmart" className="text-blue-600 hover:text-blue-800">
                                Continue Shopping
                            </Link>
                            <Link href="/patient/dashboard" className="text-gray-600 hover:text-gray-800">
                                Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {orders.length > 0 ? (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Your Orders ({orders.length})
                        </h2>

                        {orders.map((order) => (
                            <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Order Header */}
                                <div className="bg-gray-50 p-4 border-b border-gray-200">
                                    <div className="flex flex-wrap justify-between items-start gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Order Number</p>
                                            <p className="font-bold text-gray-800 text-lg">{order.orderNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Order Date</p>
                                            <p className="font-medium text-gray-800">{formatDate(order.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Status</p>
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Total Amount</p>
                                            <p className="font-bold text-green-600 text-xl">₹{order.totalAmount.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-800 mb-3">Items ({order.items.length})</h3>
                                    <div className="space-y-3">
                                        {order.items.map((item, index) => (
                                            <div key={index} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                                                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    {item.medicine?.images && item.medicine.images.length > 0 ? (
                                                        <img
                                                            src={item.medicine.images[0]}
                                                            alt={item.medicineName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-3xl">💊</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-800">{item.medicineName}</p>
                                                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="font-bold text-gray-800">₹{item.finalPrice.toFixed(2)}</span>
                                                        {item.finalPrice < item.price && (
                                                            <span className="text-sm text-gray-500 line-through">₹{item.price.toFixed(2)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600">Subtotal</p>
                                                    <p className="font-bold text-gray-800">₹{(item.finalPrice * item.quantity).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Delivery Address */}
                                <div className="p-4 bg-gray-50 border-t border-gray-200">
                                    <h3 className="font-semibold text-gray-800 mb-2">Delivery Address</h3>
                                    <div className="text-sm text-gray-700">
                                        <p className="font-medium">{order.deliveryAddress.fullName}</p>
                                        <p>{order.deliveryAddress.phone}</p>
                                        <p>{order.deliveryAddress.addressLine1}</p>
                                        {order.deliveryAddress.addressLine2 && <p>{order.deliveryAddress.addressLine2}</p>}
                                        <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
                                        {order.deliveryAddress.landmark && <p>Landmark: {order.deliveryAddress.landmark}</p>}
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="p-4 border-t border-gray-200">
                                    <div className="max-w-md ml-auto space-y-2">
                                        <div className="flex justify-between text-gray-700">
                                            <span>Subtotal</span>
                                            <span className="font-medium">₹{order.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-700">
                                            <span>Delivery Charges</span>
                                            <span className="font-medium">
                                                {order.deliveryCharges === 0 ? (
                                                    <span className="text-green-600">FREE</span>
                                                ) : (
                                                    `₹${order.deliveryCharges.toFixed(2)}`
                                                )}
                                            </span>
                                        </div>
                                        {order.discount > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Discount</span>
                                                <span className="font-medium">-₹{order.discount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-gray-200">
                                            <span>Total Amount</span>
                                            <span className="text-green-600">₹{order.totalAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="text-sm text-gray-600 pt-2">
                                            <p>💳 Payment Method: {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}</p>
                                            {order.estimatedDelivery && (
                                                <p>📅 Estimated Delivery: {formatDate(order.estimatedDelivery)}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 glass rounded-2xl">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">No Orders Yet</h3>
                        <p className="text-gray-600 mb-6">You haven't placed any orders yet</p>
                        <Link href="/medmart">
                            <button className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-green-600 transition-colors font-medium">
                                Start Shopping
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
