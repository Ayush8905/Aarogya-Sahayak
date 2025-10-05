'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CartPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session || session.user.role !== 'patient') {
            router.push('/auth/signin');
            return;
        }
        fetchCart();
    }, [session, status]);

    const fetchCart = async () => {
        try {
            const response = await fetch('/api/cart');
            if (response.ok) {
                const data = await response.json();
                setCart(data.cart);
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (medicineId, newQuantity) => {
        setUpdating(medicineId);

        try {
            const response = await fetch('/api/cart', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medicineId, quantity: newQuantity })
            });

            const data = await response.json();

            if (response.ok) {
                setCart(data.cart);
            } else {
                alert(data.error || 'Failed to update cart');
            }
        } catch (error) {
            console.error('Error updating cart:', error);
            alert('Error updating cart');
        } finally {
            setUpdating(null);
        }
    };

    const removeItem = async (medicineId) => {
        await updateQuantity(medicineId, 0);
    };

    const clearCart = async () => {
        if (!confirm('Are you sure you want to clear your cart?')) return;

        try {
            const response = await fetch('/api/cart', {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchCart();
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    };

    const calculateDeliveryCharges = () => {
        const subtotal = cart?.subtotal || 0;
        return subtotal >= 500 ? 0 : 50;
    };

    const calculateTotal = () => {
        const subtotal = cart?.subtotal || 0;
        const delivery = calculateDeliveryCharges();
        return subtotal + delivery;
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
                                ← Shopping Cart
                            </h1>
                        </Link>
                        <Link href="/medmart" className="text-blue-600 hover:text-blue-800">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {cart && cart.items.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Cart Items ({cart.totalItems})
                                </h2>
                                <button
                                    onClick={clearCart}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                >
                                    Clear Cart
                                </button>
                            </div>

                            {cart.items.map((item) => {
                                const medicine = item.medicine;
                                if (!medicine) return null;

                                return (
                                    <div key={item._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <div className="flex gap-4">
                                            {/* Medicine Image */}
                                            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {medicine.images && medicine.images.length > 0 ? (
                                                    <img
                                                        src={medicine.images[0]}
                                                        alt={medicine.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = '<span class="text-4xl">💊</span>';
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-4xl">💊</span>
                                                )}
                                            </div>

                                            {/* Medicine Details */}
                                            <div className="flex-1">
                                                <Link href={`/medmart/${medicine._id}`}>
                                                    <h3 className="font-bold text-gray-800 text-lg hover:text-blue-600 cursor-pointer">
                                                        {medicine.name}
                                                    </h3>
                                                </Link>

                                                {medicine.genericName && (
                                                    <p className="text-sm text-gray-600">{medicine.genericName}</p>
                                                )}

                                                <p className="text-xs text-gray-500 mt-1">{medicine.manufacturer}</p>

                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                        {medicine.category}
                                                    </span>
                                                    {medicine.requiresPrescription && (
                                                        <span className="text-xs font-medium bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                                            📋 Prescription Required
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Price */}
                                                <div className="mt-3 flex items-center gap-2">
                                                    <span className="text-xl font-bold text-green-600">
                                                        ₹{item.finalPrice.toFixed(2)}
                                                    </span>
                                                    {item.finalPrice < item.price && (
                                                        <span className="text-sm text-gray-500 line-through">
                                                            ₹{item.price.toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Quantity Controls */}
                                                <div className="mt-4 flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateQuantity(medicine._id, item.quantity - 1)}
                                                            disabled={updating === medicine._id || item.quantity <= 1}
                                                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 font-bold"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-12 text-center font-medium">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(medicine._id, item.quantity + 1)}
                                                            disabled={updating === medicine._id || item.quantity >= medicine.stockQuantity}
                                                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 font-bold"
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => removeItem(medicine._id)}
                                                        disabled={updating === medicine._id}
                                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                    >
                                                        🗑️ Remove
                                                    </button>
                                                </div>

                                                {/* Subtotal for this item */}
                                                <div className="mt-2">
                                                    <span className="text-sm text-gray-600">
                                                        Subtotal: <span className="font-bold text-gray-800">₹{(item.finalPrice * item.quantity).toFixed(2)}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-20">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-gray-700">
                                        <span>Subtotal ({cart.totalItems} items)</span>
                                        <span className="font-medium">₹{cart.subtotal.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between text-gray-700">
                                        <span>Delivery Charges</span>
                                        <span className="font-medium">
                                            {calculateDeliveryCharges() === 0 ? (
                                                <span className="text-green-600">FREE</span>
                                            ) : (
                                                `₹${calculateDeliveryCharges()}.00`
                                            )}
                                        </span>
                                    </div>

                                    {cart.subtotal < 500 && (
                                        <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                                            Add ₹{(500 - cart.subtotal).toFixed(2)} more to get FREE delivery!
                                        </p>
                                    )}

                                    <div className="border-t border-gray-200 pt-3">
                                        <div className="flex justify-between text-lg font-bold text-gray-800">
                                            <span>Total Amount</span>
                                            <span className="text-green-600">₹{calculateTotal().toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <Link href="/medmart/checkout">
                                    <button className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 rounded-lg hover:from-blue-600 hover:to-green-600 transition-colors font-bold text-lg">
                                        Proceed to Checkout
                                    </button>
                                </Link>

                                <p className="text-xs text-gray-500 text-center mt-4">
                                    🔒 Secure Checkout • COD Available
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 glass rounded-2xl">
                        <div className="text-6xl mb-4">🛒</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h3>
                        <p className="text-gray-600 mb-6">Add some medicines to your cart to continue</p>
                        <Link href="/medmart">
                            <button className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-green-600 transition-colors font-medium">
                                Browse Medicines
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
