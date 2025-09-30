'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function BookAppointment() {
    const { data: session } = useSession();
    const router = useRouter();
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        workerId: '',
        title: '',
        description: '',
        scheduledDate: '',
        appointmentType: 'consultation',
        duration: 30
    });

    useEffect(() => {
        if (!session) {
            router.push('/auth/signin');
            return;
        }

        if (session.user.role !== 'patient') {
            router.push('/worker/dashboard');
            return;
        }

        fetchWorkers();
    }, [session]);

    const fetchWorkers = async () => {
        try {
            const response = await fetch('/api/users?role=worker');
            if (response.ok) {
                const data = await response.json();
                setWorkers(data.users || []);
            } else {
                console.error('Failed to fetch workers');
                // Set demo workers if API fails
                setWorkers([
                    {
                        _id: 'demo-worker-1',
                        name: 'Dr. Demo Smith',
                        email: 'demo1@example.com',
                        specialization: 'General Medicine'
                    },
                    {
                        _id: 'demo-worker-2',
                        name: 'Dr. Demo Johnson',
                        email: 'demo2@example.com',
                        specialization: 'Pediatrics'
                    }
                ]);
            }
        } catch (error) {
            console.error('Error fetching workers:', error);
            // Set demo workers on error
            setWorkers([
                {
                    _id: 'demo-worker-1',
                    name: 'Dr. Demo Smith',
                    email: 'demo1@example.com',
                    specialization: 'General Medicine'
                },
                {
                    _id: 'demo-worker-2',
                    name: 'Dr. Demo Johnson',
                    email: 'demo2@example.com',
                    specialization: 'Pediatrics'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                alert('Appointment request sent successfully!');
                router.push('/patient/dashboard');
            } else {
                alert(data.error || 'Failed to book appointment');
            }
        } catch (error) {
            console.error('Error booking appointment:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Get current date in YYYY-MM-DDTHH:MM format for datetime-local input
    const getCurrentDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8 animate-fadeIn">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-custom">
                        <span className="text-white text-2xl">📅</span>
                    </div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Book an Appointment
                    </h2>
                    <p className="mt-3 text-lg text-gray-600">
                        Schedule a consultation with a health worker
                    </p>
                </div>

                <div className="glass shadow-2xl rounded-3xl p-8 animate-slideIn">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Health Worker Selection */}
                        <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                            <label htmlFor="workerId" className="block text-sm font-bold text-gray-700 mb-2">
                                🩺 Select Health Worker
                            </label>
                            <select
                                id="workerId"
                                name="workerId"
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900"
                                value={formData.workerId}
                                onChange={handleChange}
                                style={{
                                    color: '#1f2937 !important',
                                    backgroundColor: 'white !important'
                                }}
                            >
                                <option value="" style={{ color: '#9ca3af' }}>Choose a health worker</option>
                                {workers.map((worker) => (
                                    <option key={worker._id} value={worker._id} style={{ color: '#1f2937' }}>
                                        {worker.name} - {worker.specialization} ({worker.experience} years exp.)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Appointment Title */}
                        <div className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                            <label htmlFor="title" className="block text-sm font-bold text-gray-700 mb-2">
                                📝 Appointment Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900"
                                placeholder="e.g., General Checkup, Fever Consultation"
                                value={formData.title}
                                onChange={handleChange}
                                style={{
                                    color: '#1f2937 !important',
                                    backgroundColor: 'white !important'
                                }}
                            />
                        </div>

                        {/* Appointment Type */}
                        <div className="animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                            <label htmlFor="appointmentType" className="block text-sm font-bold text-gray-700 mb-2">
                                🏥 Appointment Type
                            </label>
                            <select
                                id="appointmentType"
                                name="appointmentType"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900"
                                value={formData.appointmentType}
                                onChange={handleChange}
                                style={{
                                    color: '#1f2937 !important',
                                    backgroundColor: 'white !important'
                                }}
                            >
                                <option value="consultation" style={{ color: '#1f2937' }}>💬 Consultation</option>
                                <option value="checkup" style={{ color: '#1f2937' }}>🔍 Regular Checkup</option>
                                <option value="follow-up" style={{ color: '#1f2937' }}>🔄 Follow-up</option>
                                <option value="emergency" style={{ color: '#1f2937' }}>🚨 Emergency</option>
                            </select>
                        </div>

                        {/* Scheduled Date and Time */}
                        <div className="animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                            <label htmlFor="scheduledDate" className="block text-sm font-bold text-gray-700 mb-2">
                                📅 Preferred Date and Time
                            </label>
                            <input
                                type="datetime-local"
                                id="scheduledDate"
                                name="scheduledDate"
                                required
                                min={getCurrentDateTime()}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900"
                                value={formData.scheduledDate}
                                onChange={handleChange}
                                style={{
                                    color: '#1f2937 !important',
                                    backgroundColor: 'white !important'
                                }}
                            />
                        </div>

                        {/* Duration */}
                        <div className="animate-fadeIn" style={{ animationDelay: '0.5s' }}>
                            <label htmlFor="duration" className="block text-sm font-bold text-gray-700 mb-2">
                                ⏱️ Expected Duration (minutes)
                            </label>
                            <select
                                id="duration"
                                name="duration"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900"
                                value={formData.duration}
                                onChange={handleChange}
                                style={{
                                    color: '#1f2937 !important',
                                    backgroundColor: 'white !important'
                                }}
                            >
                                <option value={15} style={{ color: '#1f2937' }}>15 minutes</option>
                                <option value={30} style={{ color: '#1f2937' }}>30 minutes</option>
                                <option value={45} style={{ color: '#1f2937' }}>45 minutes</option>
                                <option value={60} style={{ color: '#1f2937' }}>1 hour</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div className="animate-fadeIn" style={{ animationDelay: '0.6s' }}>
                            <label htmlFor="description" className="block text-sm font-bold text-gray-700 mb-2">
                                📋 Description of Issue (Optional)
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none bg-white text-gray-900"
                                placeholder="Describe your symptoms or the reason for the appointment..."
                                value={formData.description}
                                onChange={handleChange}
                                style={{
                                    color: '#1f2937 !important',
                                    backgroundColor: 'white !important'
                                }}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex space-x-4 animate-fadeIn" style={{ animationDelay: '0.7s' }}>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 py-3 px-6 border border-gray-300 rounded-xl shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300 btn-animated"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-3 px-6 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300 btn-animated flex items-center justify-center space-x-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="loading-shimmer w-4 h-4 rounded-full"></div>
                                        <span>Booking...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>📅</span>
                                        <span>Book Appointment</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Enhanced Information Card */}
                <div className="mt-8 glass rounded-2xl p-6 animate-fadeIn" style={{ animationDelay: '0.8s' }}>
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-xl">💡</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-3">
                                Booking Information
                            </h3>
                            <div className="space-y-2">
                                {[
                                    "Your appointment request will be sent to the selected health worker",
                                    "You will receive a notification once the worker responds",
                                    "You can chat with the worker while waiting for approval",
                                    "Emergency appointments are prioritized"
                                ].map((info, index) => (
                                    <div key={index} className="flex items-center space-x-3 text-sm text-gray-700">
                                        <span className="text-green-500">✓</span>
                                        <span>{info}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}