'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function MedicineDetailPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();
    const medicineId = params.id;

    const [medicine, setMedicine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        fetchMedicine();
    }, [medicineId]);

    const fetchMedicine = async () => {
        try {
            const response = await fetch(`/api/medicines/${medicineId}`);
            if (response.ok) {
                const data = await response.json();
                setMedicine(data.medicine);
            } else {
                router.push('/medmart');
            }
        } catch (error) {
            console.error('Error fetching medicine:', error);
            router.push('/medmart');
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async () => {
        if (!session || session.user.role !== 'patient') {
            router.push('/auth/signin');
            return;
        }

        setAddingToCart(true);

        try {
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medicineId: medicine._id, quantity })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Added to cart! 🛒');
                router.push('/medmart/cart');
            } else {
                alert(data.error || 'Failed to add to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Error adding to cart');
        } finally {
            setAddingToCart(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!medicine) {
        return null;
    }

    const isExpiringSoon = () => {
        const expiryDate = new Date(medicine.expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry < 90 && daysUntilExpiry > 0;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/medmart">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent hover:opacity-80 cursor-pointer">
                                ← Back to MedMart
                            </h1>
                        </Link>
                        {session?.user?.role === 'patient' && (
                            <Link href="/medmart/cart">
                                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                    🛒 View Cart
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Images Section */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="aspect-square bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center overflow-hidden">
                                {medicine.images && medicine.images.length > 0 ? (
                                    <img
                                        src={medicine.images[selectedImage]}
                                        alt={medicine.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = '<span class="text-9xl">💊</span>';
                                        }}
                                    />
                                ) : (
                                    <span className="text-9xl">💊</span>
                                )}
                            </div>
                        </div>

                        {/* Thumbnail Images */}
                        {medicine.images && medicine.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {medicine.images.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                                            }`}
                                    >
                                        <img
                                            src={img}
                                            alt={`${medicine.name} ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            {/* Category Badge */}
                            <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full mb-4">
                                {medicine.category}
                            </span>

                            {/* Medicine Name */}
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">{medicine.name}</h1>

                            {/* Generic Name */}
                            {medicine.genericName && (
                                <p className="text-lg text-gray-600 mb-4">{medicine.genericName}</p>
                            )}

                            {/* Manufacturer */}
                            <p className="text-sm text-gray-500 mb-6">
                                Manufacturer: <span className="font-medium text-gray-700">{medicine.manufacturer}</span>
                            </p>

                            {/* Price */}
                            <div className="flex items-center gap-3 mb-6">
                                {medicine.discountPercentage > 0 ? (
                                    <>
                                        <span className="text-4xl font-bold text-green-600">
                                            ₹{medicine.finalPrice.toFixed(2)}
                                        </span>
                                        <span className="text-xl text-gray-500 line-through">
                                            ₹{medicine.price.toFixed(2)}
                                        </span>
                                        <span className="text-lg font-medium text-green-600 bg-green-100 px-3 py-1 rounded">
                                            {medicine.discountPercentage}% OFF
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-4xl font-bold text-gray-800">
                                        ₹{medicine.price.toFixed(2)}
                                    </span>
                                )}
                            </div>

                            {/* Stock Status */}
                            <div className="mb-6">
                                {medicine.stockQuantity > 0 ? (
                                    <div>
                                        <span className="text-lg font-medium text-green-600">
                                            ✓ In Stock
                                        </span>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {medicine.stockQuantity} {medicine.unit}(s) available
                                        </p>
                                    </div>
                                ) : (
                                    <span className="text-lg font-medium text-red-600">
                                        ✗ Out of Stock
                                    </span>
                                )}
                            </div>

                            {/* Prescription Required */}
                            {medicine.requiresPrescription && (
                                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                    <p className="text-orange-800 font-medium">📋 Prescription Required</p>
                                    <p className="text-sm text-orange-700 mt-1">
                                        A valid prescription is required to purchase this medicine
                                    </p>
                                </div>
                            )}

                            {/* Expiry Warning */}
                            {isExpiringSoon() && (
                                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-yellow-800 font-medium">⚠️ Expiring Soon</p>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Expiry Date: {formatDate(medicine.expiryDate)}
                                    </p>
                                </div>
                            )}

                            {/* Quantity Selector */}
                            {session?.user?.role === 'patient' && medicine.stockQuantity > 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quantity
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 font-bold text-lg"
                                        >
                                            −
                                        </button>
                                        <span className="w-16 text-center font-bold text-xl">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => setQuantity(Math.min(medicine.stockQuantity, quantity + 1))}
                                            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 font-bold text-lg"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Add to Cart Button */}
                            {session?.user?.role === 'patient' ? (
                                <button
                                    onClick={addToCart}
                                    disabled={medicine.stockQuantity === 0 || addingToCart}
                                    className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-4 rounded-lg hover:from-blue-600 hover:to-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
                                >
                                    {addingToCart ? '➕ Adding to Cart...' : '🛒 Add to Cart'}
                                </button>
                            ) : !session ? (
                                <Link href="/auth/signin">
                                    <button className="w-full bg-gray-600 text-white py-4 rounded-lg hover:bg-gray-700 transition-colors font-bold text-lg">
                                        Sign in to Buy
                                    </button>
                                </Link>
                            ) : null}
                        </div>

                        {/* Additional Information */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Product Information</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Package Size</span>
                                    <span className="font-medium text-gray-800">{medicine.packageSize}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Unit</span>
                                    <span className="font-medium text-gray-800">{medicine.unit}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Dosage Form</span>
                                    <span className="font-medium text-gray-800">{medicine.dosageForm}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Strength</span>
                                    <span className="font-medium text-gray-800">{medicine.strength}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Expiry Date</span>
                                    <span className="font-medium text-gray-800">{formatDate(medicine.expiryDate)}</span>
                                </div>
                                {medicine.totalSold > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Sold</span>
                                        <span className="font-medium text-gray-800">{medicine.totalSold} units</span>
                                    </div>
                                )}
                            </div>

                            {medicine.description && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{medicine.description}</p>
                                </div>
                            )}

                            {medicine.sideEffects && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h3 className="font-semibold text-gray-800 mb-2">Side Effects</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{medicine.sideEffects}</p>
                                </div>
                            )}

                            {medicine.storageInstructions && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h3 className="font-semibold text-gray-800 mb-2">Storage Instructions</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{medicine.storageInstructions}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
