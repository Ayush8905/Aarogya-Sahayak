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
                setWorkers(data.users);
            }
        } catch (error) {
            console.error('Error fetching workers:', error);
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
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        Book an Appointment
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Schedule a consultation with a health worker
                    </p>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Health Worker Selection */}
                        <div>
                            <label htmlFor="workerId" className="block text-sm font-medium text-gray-700">
                                Select Health Worker
                            </label>
                            <select
                                id="workerId"
                                name="workerId"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.workerId}
                                onChange={handleChange}
                            >
                                <option value="">Choose a health worker</option>
                                {workers.map((worker) => (
                                    <option key={worker._id} value={worker._id}>
                                        {worker.name} - {worker.specialization} ({worker.experience} years exp.)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Appointment Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                Appointment Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="e.g., General Checkup, Fever Consultation"
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Appointment Type */}
                        <div>
                            <label htmlFor="appointmentType" className="block text-sm font-medium text-gray-700">
                                Appointment Type
                            </label>
                            <select
                                id="appointmentType"
                                name="appointmentType"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.appointmentType}
                                onChange={handleChange}
                            >
                                <option value="consultation">Consultation</option>
                                <option value="checkup">Regular Checkup</option>
                                <option value="follow-up">Follow-up</option>
                                <option value="emergency">Emergency</option>
                            </select>
                        </div>

                        {/* Scheduled Date and Time */}
                        <div>
                            <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700">
                                Preferred Date and Time
                            </label>
                            <input
                                type="datetime-local"
                                id="scheduledDate"
                                name="scheduledDate"
                                required
                                min={getCurrentDateTime()}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.scheduledDate}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Duration */}
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                                Expected Duration (minutes)
                            </label>
                            <select
                                id="duration"
                                name="duration"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.duration}
                                onChange={handleChange}
                            >
                                <option value={15}>15 minutes</option>
                                <option value={30}>30 minutes</option>
                                <option value={45}>45 minutes</option>
                                <option value={60}>1 hour</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Description of Issue (Optional)
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Describe your symptoms or the reason for the appointment..."
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {submitting ? 'Booking...' : 'Book Appointment'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Information Card */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <div className="h-5 w-5 text-blue-400">ℹ️</div>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                Booking Information
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Your appointment request will be sent to the selected health worker</li>
                                    <li>You will receive a notification once the worker responds</li>
                                    <li>You can chat with the worker while waiting for approval</li>
                                    <li>Emergency appointments are prioritized</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}