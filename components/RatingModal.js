'use client';
import { useState } from 'react';

export default function RatingModal({ appointment, onClose, onSubmit }) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointmentId: appointment._id,
                    workerId: appointment.worker._id || appointment.worker,
                    rating,
                    comment,
                    isPublic
                }),
            });

            const data = await response.json();

            if (response.ok) {
                onSubmit(data.rating);
            } else {
                setError(data.error || 'Failed to submit rating');
            }
        } catch (error) {
            console.error('Submit rating error:', error);
            setError('Error submitting rating. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = () => {
        return [1, 2, 3, 4, 5].map((star) => (
            <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
            >
                <svg
                    className={`w-10 h-10 ${
                        star <= (hoveredRating || rating)
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
            </button>
        ));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Rate Your Appointment</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Appointment Info */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-800">{appointment.title}</p>
                        <p className="text-sm text-gray-600">
                            Dr. {appointment.worker?.name || 'Healthcare Worker'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {new Date(appointment.scheduledDate).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Star Rating */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            How would you rate your experience?
                        </label>
                        <div className="flex justify-center gap-2">
                            {renderStars()}
                        </div>
                        {rating > 0 && (
                            <p className="text-center mt-2 text-gray-600">
                                {rating === 1 && 'Poor'}
                                {rating === 2 && 'Fair'}
                                {rating === 3 && 'Good'}
                                {rating === 4 && 'Very Good'}
                                {rating === 5 && 'Excellent'}
                            </p>
                        )}
                    </div>

                    {/* Comment */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Share your experience (optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell us about your appointment..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={4}
                            maxLength={1000}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {comment.length}/1000 characters
                        </p>
                    </div>

                    {/* Privacy Toggle */}
                    <div className="mb-6 flex items-center">
                        <input
                            type="checkbox"
                            id="isPublic"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                            Make this review public (visible to other patients)
                        </label>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || rating === 0}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Submit Rating'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
