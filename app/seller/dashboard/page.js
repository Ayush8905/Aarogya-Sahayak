'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SellerDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [medicines, setMedicines] = useState([]);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        totalMedicines: 0,
        totalOrders: 0,
        pendingOrders: 0,
        revenue: 0
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('medicines');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
            return;
        }
        if (session.user.role !== 'seller') {
            router.push('/');
            return;
        }
        fetchDashboardData();
    }, [session, status]);

    const fetchDashboardData = async () => {
        try {
            // Fetch medicines
            const medResponse = await fetch('/api/medicines?seller=me');
            if (medResponse.ok) {
                const medData = await medResponse.json();
                setMedicines(medData.medicines || []);
            }

            // Fetch orders
            const orderResponse = await fetch('/api/orders?seller=true');
            if (orderResponse.ok) {
                const orderData = await orderResponse.json();
                setOrders(orderData.orders || []);

                // Calculate stats
                const totalOrders = orderData.orders.length;
                const pendingOrders = orderData.orders.filter(o => o.status === 'pending').length;
                const revenue = orderData.orders
                    .filter(o => o.status === 'delivered')
                    .reduce((sum, o) => sum + o.totalAmount, 0);

                setStats({
                    totalMedicines: medData.medicines?.length || 0,
                    totalOrders,
                    pendingOrders,
                    revenue
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteMedicine = async (medicineId) => {
        if (!confirm('Are you sure you want to delete this medicine?')) return;

        try {
            const response = await fetch(`/api/medicines/${medicineId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                alert('Medicine deleted successfully');
                fetchDashboardData();
            }
        } catch (error) {
            console.error('Error deleting medicine:', error);
            alert('Failed to delete medicine');
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                alert('Order status updated');
                fetchDashboardData();
            }
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Failed to update order');
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!session || session.user.role !== 'seller') return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                            💊 Seller Dashboard - MedMart
                        </h1>
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/medmart"
                                className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                View Store
                            </Link>
                            <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                        {session.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-gray-700 font-medium">{session.user.name}</span>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors font-medium shadow-sm"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Medicines</p>
                                <p className="text-3xl font-bold text-gray-800">{stats.totalMedicines}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl">
                                💊
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Orders</p>
                                <p className="text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-2xl">
                                📦
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending Orders</p>
                                <p className="text-3xl font-bold text-gray-800">{stats.pendingOrders}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white text-2xl">
                                ⏳
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Revenue</p>
                                <p className="text-3xl font-bold text-gray-800">₹{stats.revenue.toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl">
                                💰
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('medicines')}
                            className={`px-6 py-4 font-medium ${activeTab === 'medicines'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            My Medicines ({medicines.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-6 py-4 font-medium ${activeTab === 'orders'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Orders ({orders.length})
                        </button>
                    </div>

                    <div className="p-6">
                        {/* Medicines Tab */}
                        {activeTab === 'medicines' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-800">My Medicines</h2>
                                    <Link
                                        href="/seller/add-medicine"
                                        className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-green-600 transition-colors"
                                    >
                                        + Add New Medicine
                                    </Link>
                                </div>

                                {medicines.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {medicines.map((medicine) => (
                                            <div key={medicine._id} className="border border-gray-200 rounded-lg p-4">
                                                {/* Medicine Image */}
                                                <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                                                    {medicine.images && medicine.images.length > 0 ? (
                                                        <img
                                                            src={medicine.images[0]}
                                                            alt={medicine.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.parentElement.innerHTML = '<span class="text-6xl">💊</span>';
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-6xl">💊</span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-gray-800 mb-2">{medicine.name}</h3>
                                                <p className="text-sm text-gray-600 mb-2">{medicine.category}</p>
                                                <div className="flex justify-between items-center mb-2">
                                                    <div>
                                                        {medicine.discountPercentage > 0 ? (
                                                            <>
                                                                <span className="text-lg font-bold text-green-600">
                                                                    ₹{medicine.finalPrice?.toFixed(2) || medicine.price}
                                                                </span>
                                                                <span className="text-sm text-gray-500 line-through ml-2">
                                                                    ₹{medicine.price}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="text-lg font-bold text-green-600">
                                                                ₹{medicine.price}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`text-sm px-2 py-1 rounded ${medicine.stockQuantity > 0
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {medicine.stockQuantity > 0 ? `Stock: ${medicine.stockQuantity}` : 'Out of Stock'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2 mt-4">
                                                    <Link
                                                        href={`/seller/edit-medicine/${medicine._id}`}
                                                        className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-center text-sm"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => deleteMedicine(medicine._id)}
                                                        className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-gray-600 mb-4">No medicines added yet</p>
                                        <Link
                                            href="/seller/add-medicine"
                                            className="inline-block bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-green-600"
                                        >
                                            Add Your First Medicine
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Orders Tab */}
                        {activeTab === 'orders' && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Customer Orders</h2>

                                {orders.length > 0 ? (
                                    <div className="space-y-4">
                                        {orders.map((order) => (
                                            <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <p className="font-medium text-gray-800">
                                                            Order #{order._id.slice(-8)}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {new Date(order.createdAt).toLocaleDateString()}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Customer: {order.patient?.name || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-green-600">
                                                            ₹{order.totalAmount}
                                                        </p>
                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                                    order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                                                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                                            'bg-red-100 text-red-800'
                                                            }`}>
                                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                                                    {order.items?.map((item, idx) => (
                                                        <div key={idx} className="text-sm text-gray-600 ml-4">
                                                            • {item.medicine?.name || 'N/A'} x {item.quantity} - ₹{item.price * item.quantity}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mb-4">
                                                    <p className="text-sm font-medium text-gray-700">Delivery Address:</p>
                                                    <p className="text-sm text-gray-600">
                                                        {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
                                                    </p>
                                                </div>

                                                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                                    <div className="flex gap-2">
                                                        {order.status === 'pending' && (
                                                            <button
                                                                onClick={() => updateOrderStatus(order._id, 'confirmed')}
                                                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
                                                            >
                                                                Confirm Order
                                                            </button>
                                                        )}
                                                        {order.status === 'confirmed' && (
                                                            <button
                                                                onClick={() => updateOrderStatus(order._id, 'shipped')}
                                                                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 text-sm"
                                                            >
                                                                Mark as Shipped
                                                            </button>
                                                        )}
                                                        {order.status === 'shipped' && (
                                                            <button
                                                                onClick={() => updateOrderStatus(order._id, 'delivered')}
                                                                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm"
                                                            >
                                                                Mark as Delivered
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => updateOrderStatus(order._id, 'cancelled')}
                                                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm"
                                                        >
                                                            Cancel Order
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-gray-600">No orders yet</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
