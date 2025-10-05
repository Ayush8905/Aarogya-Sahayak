'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MedMartPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [cart, setCart] = useState(null);
    const [addingToCart, setAddingToCart] = useState(null);

    const categories = [
        'all', 'Tablets', 'Capsules', 'Syrups', 'Injections', 'Ointments',
        'Drops', 'Inhalers', 'Supplements', 'First Aid', 'Baby Care',
        'Personal Care', 'Ayurvedic', 'Homeopathic', 'Other'
    ];

    useEffect(() => {
        fetchMedicines();
        if (session?.user?.role === 'patient') {
            fetchCart();
        }
    }, [search, category, sortBy, session]);

    const fetchMedicines = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (category !== 'all') params.append('category', category);
            params.append('sortBy', sortBy);
            params.append('order', 'desc');

            const response = await fetch(`/api/medicines?${params}`);
            if (response.ok) {
                const data = await response.json();
                setMedicines(data.medicines || []);
            }
        } catch (error) {
            console.error('Error fetching medicines:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCart = async () => {
        try {
            const response = await fetch('/api/cart');
            if (response.ok) {
                const data = await response.json();
                setCart(data.cart);
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
    };

    const addToCart = async (medicineId) => {
        if (!session || session.user.role !== 'patient') {
            router.push('/auth/signin');
            return;
        }

        setAddingToCart(medicineId);

        try {
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medicineId, quantity: 1 })
            });

            const data = await response.json();

            if (response.ok) {
                setCart(data.cart);
                alert('Added to cart!');
            } else {
                alert(data.error || 'Failed to add to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Error adding to cart');
        } finally {
            setAddingToCart(null);
        }
    };

    const getCartItemCount = () => {
        return cart?.totalItems || 0;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <Link href={session?.user?.role === 'patient' ? '/patient/dashboard' : '/'}>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent hover:opacity-80">
                                    🏥 MedMart
                                </h1>
                            </Link>
                        </div>
                        <div className="flex items-center gap-4">
                            {session?.user?.role === 'patient' && (
                                <>
                                    <Link
                                        href="/medmart/orders"
                                        className="text-gray-700 hover:text-blue-600"
                                    >
                                        📦 My Orders
                                    </Link>
                                    <Link
                                        href="/medmart/cart"
                                        className="relative"
                                    >
                                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                            🛒 Cart
                                            {getCartItemCount() > 0 && (
                                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                    {getCartItemCount()}
                                                </span>
                                            )}
                                        </button>
                                    </Link>
                                </>
                            )}
                            {session?.user?.role === 'seller' && (
                                <Link
                                    href="/seller/dashboard"
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                >
                                    📊 Seller Dashboard
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Filters */}
                <div className="mb-8 glass p-6 rounded-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                placeholder="Search medicines by name, generic name, or manufacturer..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat === 'all' ? 'all' : cat}>
                                        {cat === 'all' ? 'All Categories' : cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-4">
                        <label className="flex items-center gap-2">
                            <span className="text-gray-700">Sort by:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="createdAt">Latest</option>
                                <option value="price">Price: Low to High</option>
                                <option value="avgRating">Highest Rated</option>
                                <option value="totalSold">Best Selling</option>
                            </select>
                        </label>
                    </div>
                </div>

                {/* Medicines Grid */}
                {medicines.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {medicines.map((medicine) => (
                            <div key={medicine._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow overflow-hidden">
                                {/* Medicine Image */}
                                <div className="h-48 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center overflow-hidden">
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

                                <div className="p-4">
                                    {/* Category Badge */}
                                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mb-2">
                                        {medicine.category}
                                    </span>

                                    {/* Medicine Name */}
                                    <Link href={`/medmart/${medicine._id}`}>
                                        <h3 className="font-bold text-gray-800 text-lg mb-1 hover:text-blue-600 cursor-pointer line-clamp-2">
                                            {medicine.name}
                                        </h3>
                                    </Link>

                                    {/* Generic Name */}
                                    {medicine.genericName && (
                                        <p className="text-sm text-gray-600 mb-2">
                                            {medicine.genericName}
                                        </p>
                                    )}

                                    {/* Manufacturer */}
                                    <p className="text-xs text-gray-500 mb-3">
                                        {medicine.manufacturer}
                                    </p>

                                    {/* Price */}
                                    <div className="flex items-center gap-2 mb-3">
                                        {medicine.discountPercentage > 0 ? (
                                            <>
                                                <span className="text-2xl font-bold text-green-600">
                                                    ₹{medicine.finalPrice.toFixed(2)}
                                                </span>
                                                <span className="text-sm text-gray-500 line-through">
                                                    ₹{medicine.price.toFixed(2)}
                                                </span>
                                                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                                                    {medicine.discountPercentage}% OFF
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-2xl font-bold text-gray-800">
                                                ₹{medicine.price.toFixed(2)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Stock Status */}
                                    <div className="mb-3">
                                        {medicine.stockQuantity > 0 ? (
                                            <span className="text-sm text-green-600">
                                                ✓ In Stock ({medicine.stockQuantity} {medicine.unit}s)
                                            </span>
                                        ) : (
                                            <span className="text-sm text-red-600">
                                                ✗ Out of Stock
                                            </span>
                                        )}
                                    </div>

                                    {/* Prescription Required */}
                                    {medicine.requiresPrescription && (
                                        <div className="mb-3">
                                            <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                                📋 Prescription Required
                                            </span>
                                        </div>
                                    )}

                                    {/* Add to Cart Button */}
                                    {session?.user?.role === 'patient' && (
                                        <button
                                            onClick={() => addToCart(medicine._id)}
                                            disabled={medicine.stockQuantity === 0 || addingToCart === medicine._id}
                                            className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-2 rounded-lg hover:from-blue-600 hover:to-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                        >
                                            {addingToCart === medicine._id ? '➕ Adding...' : '🛒 Add to Cart'}
                                        </button>
                                    )}
                                    {!session && (
                                        <Link href="/auth/signin">
                                            <button className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium">
                                                Sign in to Buy
                                            </button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 glass rounded-2xl">
                        <div className="text-6xl mb-4">💊</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">No Medicines Found</h3>
                        <p className="text-gray-600">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}
