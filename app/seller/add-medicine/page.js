'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddMedicinePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        genericName: '',
        description: '',
        category: 'Tablets',
        manufacturer: '',
        price: '',
        discountPercentage: '0',
        stockQuantity: '',
        unit: 'strip',
        unitsPerPack: '1',
        expiryDate: '',
        requiresPrescription: false,
        dosageForm: '',
        strength: '',
        sideEffects: '',
        usage: '',
        storage: '',
        imageUrl: ''
    });

    const categories = [
        'Tablets', 'Capsules', 'Syrups', 'Injections', 'Ointments',
        'Drops', 'Inhalers', 'Supplements', 'First Aid', 'Baby Care',
        'Personal Care', 'Ayurvedic', 'Homeopathic', 'Other'
    ];

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
    }, [session, status]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    imageUrl: reader.result // Base64 string
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/medicines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    genericName: formData.genericName,
                    description: formData.description,
                    category: formData.category,
                    manufacturer: formData.manufacturer,
                    price: parseFloat(formData.price),
                    discountPercentage: parseFloat(formData.discountPercentage || 0),
                    stockQuantity: parseInt(formData.stockQuantity),
                    unit: formData.unit,
                    unitsPerPack: parseInt(formData.unitsPerPack || 1),
                    expiryDate: formData.expiryDate,
                    requiresPrescription: formData.requiresPrescription,
                    imageUrl: formData.imageUrl,
                    dosageForm: formData.dosageForm,
                    strength: formData.strength,
                    sideEffects: formData.sideEffects,
                    usage: formData.usage,
                    storage: formData.storage
                })
            });

            if (response.ok) {
                alert('Medicine added successfully!');
                router.push('/seller/dashboard');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to add medicine');
            }
        } catch (error) {
            console.error('Error adding medicine:', error);
            alert('Error adding medicine');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') {
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
                        <Link href="/seller/dashboard" className="text-blue-600 hover:text-blue-800">
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                            Add New Medicine
                        </h1>
                        <div></div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Medicine Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Medicine Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Paracetamol 500mg"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category *
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Manufacturer */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Manufacturer *
                            </label>
                            <input
                                type="text"
                                name="manufacturer"
                                value={formData.manufacturer}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Sun Pharma, Cipla"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Brief description of the medicine"
                            />
                        </div>

                        {/* Generic Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Generic Name
                            </label>
                            <input
                                type="text"
                                name="genericName"
                                value={formData.genericName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Acetaminophen"
                            />
                        </div>

                        {/* Price and Discount */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price (₹) *
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., 50.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Discount (%)
                                </label>
                                <input
                                    type="number"
                                    name="discountPercentage"
                                    value={formData.discountPercentage}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., 10"
                                />
                            </div>
                        </div>

                        {/* Stock and Unit */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Stock Quantity *
                                </label>
                                <input
                                    type="number"
                                    name="stockQuantity"
                                    value={formData.stockQuantity}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., 100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Unit *
                                </label>
                                <select
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="strip">Strip</option>
                                    <option value="bottle">Bottle</option>
                                    <option value="box">Box</option>
                                    <option value="tube">Tube</option>
                                    <option value="piece">Piece</option>
                                    <option value="pack">Pack</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Units Per Pack
                                </label>
                                <input
                                    type="number"
                                    name="unitsPerPack"
                                    value={formData.unitsPerPack}
                                    onChange={handleChange}
                                    min="1"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., 10"
                                />
                            </div>
                        </div>

                        {/* Dosage Form and Strength */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dosage Form
                                </label>
                                <input
                                    type="text"
                                    name="dosageForm"
                                    value={formData.dosageForm}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Tablet, Capsule, Syrup"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Strength
                                </label>
                                <input
                                    type="text"
                                    name="strength"
                                    value={formData.strength}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., 500mg, 10ml"
                                />
                            </div>
                        </div>

                        {/* Expiry Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expiry Date *
                            </label>
                            <input
                                type="date"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleChange}
                                required
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Usage */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Usage / Indications
                            </label>
                            <textarea
                                name="usage"
                                value={formData.usage}
                                onChange={handleChange}
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="What is this medicine used for?"
                            />
                        </div>

                        {/* Side Effects */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Side Effects
                            </label>
                            <textarea
                                name="sideEffects"
                                value={formData.sideEffects}
                                onChange={handleChange}
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Common side effects (if any)"
                            />
                        </div>

                        {/* Storage */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Storage Instructions
                            </label>
                            <input
                                type="text"
                                name="storage"
                                value={formData.storage}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Store in cool, dry place below 25°C"
                            />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Medicine Image
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Upload an image (Max 5MB). Image will be stored in database.
                            </p>
                            {formData.imageUrl && (
                                <div className="mt-4">
                                    <img
                                        src={formData.imageUrl}
                                        alt="Preview"
                                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                                        className="mt-2 text-sm text-red-600 hover:text-red-700"
                                    >
                                        Remove Image
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Prescription Required */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="requiresPrescription"
                                checked={formData.requiresPrescription}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label className="ml-2 text-sm text-gray-700">
                                Prescription Required
                            </label>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Adding...' : 'Add Medicine'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
