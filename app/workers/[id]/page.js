'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WorkerProfile({ params }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [worker, setWorker] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('about');

    useEffect(() => {
        if (params?.id) {
            fetchWorkerProfile();
        }
    }, [params?.id]);

    const fetchWorkerProfile = async () => {
        try {
            const response = await fetch(`/api/workers/${params.id}/reviews`);
            if (response.ok) {
                const data = await response.json();
                setWorker(data.worker);
                setReviews(data.reviews);
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching worker profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <svg
                key={index}
                className={`w-5 h-5 ${index < Math.floor(rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                    }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
            </svg>
        ));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!worker) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Worker not found</h2>
                    <Link href="/patient/dashboard" className="text-blue-600 hover:underline">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/patient/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center">
                            <span className="mr-2">←</span> Back to Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Worker Profile Card */}
                <div className="glass p-8 rounded-2xl mb-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Profile Image */}
                        <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                            {worker.name.charAt(0)}
                        </div>

                        {/* Worker Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dr. {worker.name}</h1>
                            <p className="text-xl text-gray-600 mb-4">{worker.specialization}</p>

                            {/* Rating Summary */}
                            <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    {renderStars(worker.avgRating || 0)}
                                    <span className="text-2xl font-bold text-gray-800">
                                        {(worker.avgRating || 0).toFixed(1)}
                                    </span>
                                </div>
                                <span className="text-gray-600">
                                    ({worker.reviewCount || 0} reviews)
                                </span>
                            </div>

                            {/* Experience */}
                            <p className="text-gray-700 mb-4">
                                <span className="font-semibold">{worker.experience || 0}</span> years of experience
                            </p>

                            {/* Action Button */}
                            <Link
                                href={`/patient/book-appointment?workerId=${worker.id}`}
                                className="inline-block bg-gradient-to-r from-blue-500 to-green-500 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-green-600 transition-colors font-medium"
                            >
                                Book Appointment
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="flex gap-4 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('about')}
                            className={`px-4 py-2 font-medium transition-colors ${activeTab === 'about'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            About
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`px-4 py-2 font-medium transition-colors ${activeTab === 'reviews'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Reviews ({reviews.length})
                        </button>
                    </div>
                </div>

                {/* About Tab */}
                {activeTab === 'about' && (
                    <div className="space-y-6">
                        <div className="glass p-6 rounded-2xl">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">About Dr. {worker.name}</h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2">Specialization</h3>
                                    <p className="text-gray-600">{worker.specialization || 'General Medicine'}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2">Experience</h3>
                                    <p className="text-gray-600">{worker.experience || 0} years</p>
                                </div>
                                {worker.qualifications && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700 mb-2">Qualifications</h3>
                                        <p className="text-gray-600">{worker.qualifications}</p>
                                    </div>
                                )}
                                {worker.languages && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700 mb-2">Languages</h3>
                                        <p className="text-gray-600">{worker.languages}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {stats && (
                            <div className="glass p-6 rounded-2xl">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6">Rating Distribution</h2>
                                <div className="space-y-3">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count = stats.ratingDistribution[star] || 0;
                                        const percentage = stats.totalReviews > 0
                                            ? (count / stats.totalReviews) * 100
                                            : 0;

                                        return (
                                            <div key={star} className="flex items-center gap-4">
                                                <span className="text-sm font-medium text-gray-700 w-16">
                                                    {star} {star === 1 ? 'star' : 'stars'}
                                                </span>
                                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm text-gray-600 w-12 text-right">
                                                    {count}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                    <div className="space-y-4">
                        {reviews.length > 0 ? (
                            reviews.map((review) => (
                                <div key={review._id} className="glass p-6 rounded-2xl">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                {review.patient?.name?.charAt(0) || 'P'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {review.patient?.name || 'Anonymous'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {renderStars(review.rating)}
                                        </div>
                                    </div>

                                    {review.comment && (
                                        <p className="text-gray-700 mb-4">{review.comment}</p>
                                    )}

                                    {review.appointment && (
                                        <p className="text-sm text-gray-500">
                                            Appointment: {review.appointment.title} • {' '}
                                            {new Date(review.appointment.scheduledDate).toLocaleDateString()}
                                        </p>
                                    )}

                                    {review.workerResponse && (
                                        <div className="mt-4 pl-4 border-l-4 border-blue-500">
                                            <p className="text-sm font-semibold text-gray-700 mb-1">
                                                Response from Dr. {worker.name}
                                            </p>
                                            <p className="text-sm text-gray-600">{review.workerResponse}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(review.respondedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="glass p-12 rounded-2xl text-center">
                                <p className="text-gray-600">No reviews yet</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
