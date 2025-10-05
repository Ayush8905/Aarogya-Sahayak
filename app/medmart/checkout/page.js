'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        landmark: ''
    });

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
                if (!data.cart || data.cart.items.length === 0) {
                    router.push('/medmart/cart');
                    return;
                }
                setCart(data.cart);
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setDeliveryAddress({
            ...deliveryAddress,
            [e.target.name]: e.target.value
        });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deliveryAddress,
                    paymentMethod: 'COD'
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Order placed successfully! 🎉');
                router.push(`/medmart/orders`);
            } else {
                alert(data.error || 'Failed to place order');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Error placing order. Please try again.');
        } finally {
            setSubmitting(false);
        }
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
                        <Link href="/medmart/cart">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent hover:opacity-80 cursor-pointer">
                                ← Checkout
                            </h1>
                        </Link>
                        <Link href="/medmart/cart" className="text-blue-600 hover:text-blue-800">
                            Back to Cart
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Delivery Address Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6">Delivery Address</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={deliveryAddress.fullName}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={deliveryAddress.phone}
                                            onChange={handleInputChange}
                                            required
                                            pattern="[0-9]{10}"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="10-digit mobile number"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address Line 1 *
                                        </label>
                                        <input
                                            type="text"
                                            name="addressLine1"
                                            value={deliveryAddress.addressLine1}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="House No., Building Name"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address Line 2
                                        </label>
                                        <input
                                            type="text"
                                            name="addressLine2"
                                            value={deliveryAddress.addressLine2}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Road Name, Area"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            City *
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={deliveryAddress.city}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="City"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            State *
                                        </label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={deliveryAddress.state}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="State"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Pincode *
                                        </label>
                                        <input
                                            type="text"
                                            name="pincode"
                                            value={deliveryAddress.pincode}
                                            onChange={handleInputChange}
                                            required
                                            pattern="[0-9]{6}"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="6-digit pincode"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Landmark
                                        </label>
                                        <input
                                            type="text"
                                            name="landmark"
                                            value={deliveryAddress.landmark}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Nearby landmark"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Method</h2>
                                <div className="flex items-center gap-3 p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked
                                        readOnly
                                        className="w-4 h-4"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-800">Cash on Delivery (COD)</p>
                                        <p className="text-sm text-gray-600">Pay when you receive your order</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-20">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>

                                {/* Cart Items */}
                                <div className="mb-4 max-h-60 overflow-y-auto space-y-3">
                                    {cart?.items.map((item) => (
                                        <div key={item._id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {item.medicine?.images && item.medicine.images.length > 0 ? (
                                                    <img
                                                        src={item.medicine.images[0]}
                                                        alt={item.medicine?.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-2xl">💊</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm text-gray-800 line-clamp-1">
                                                    {item.medicine?.name}
                                                </p>
                                                <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                                <p className="text-sm font-bold text-gray-800 mt-1">
                                                    ₹{(item.finalPrice * item.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-gray-200 pt-4 space-y-3">
                                    <div className="flex justify-between text-gray-700">
                                        <span>Subtotal ({cart?.totalItems} items)</span>
                                        <span className="font-medium">₹{cart?.subtotal.toFixed(2)}</span>
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

                                    <div className="border-t border-gray-200 pt-3">
                                        <div className="flex justify-between text-lg font-bold text-gray-800">
                                            <span>Total Amount</span>
                                            <span className="text-green-600">₹{calculateTotal().toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full mt-6 bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 rounded-lg hover:from-blue-600 hover:to-green-600 transition-colors font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? '⏳ Placing Order...' : '🛍️ Place Order'}
                                </button>

                                <p className="text-xs text-gray-500 text-center mt-4">
                                    🔒 Secure Checkout • Your order will be confirmed
                                </p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
