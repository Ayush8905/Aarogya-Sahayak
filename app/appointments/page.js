'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RatingModal from '@/components/RatingModal';

export default function AppointmentsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
            return;
        }
        fetchAppointments();
    }, [session, status]);

    const fetchAppointments = async () => {
        try {
            const response = await fetch('/api/appointments');
            if (response.ok) {
                const data = await response.json();
                setAppointments(data.appointments || []);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const cancelAppointment = async (appointmentId) => {
        try {
            const response = await fetch(`/api/appointments/${appointmentId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchAppointments();
                alert('Appointment cancelled successfully');
            }
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            alert('Failed to cancel appointment');
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            <header className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href={session.user.role === 'patient' ? '/patient/dashboard' : '/worker/dashboard'}>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent hover:opacity-80">
                                ← My Appointments
                            </h1>
                        </Link>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Welcome, {session.user.name}</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="glass p-6 rounded-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">My Appointments</h2>
                        <Link
                            href="/patient/book-appointment"
                            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            + Book New Appointment
                        </Link>
                    </div>

                    {appointments.length > 0 ? (
                        <div className="space-y-4">
                            {appointments.map((appointment) => (
                                <div key={appointment._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-2">
                                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mr-3">
                                                    <span className="text-white font-bold">
                                                        {appointment.workerName ? appointment.workerName.charAt(0) : 'H'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800">
                                                        {appointment.workerName || 'Healthcare Worker'}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">{appointment.type || 'General Consultation'}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">Date</p>
                                                    <p className="text-gray-900">{new Date(appointment.date).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">Time</p>
                                                    <p className="text-gray-900">{appointment.time}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">Status</p>
                                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {appointment.status || 'pending'}
                                                    </span>
                                                </div>
                                            </div>

                                            {appointment.notes && (
                                                <div className="mt-4">
                                                    <p className="text-sm font-medium text-gray-700">Notes</p>
                                                    <p className="text-gray-900 text-sm">{appointment.notes}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col space-y-2 ml-4">
                                            {appointment.status === 'completed' && !appointment.hasRating && session.user.role === 'patient' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedAppointment(appointment);
                                                        setShowRatingModal(true);
                                                    }}
                                                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    ⭐ Rate Appointment
                                                </button>
                                            )}
                                            {appointment.status === 'completed' && appointment.hasRating && (
                                                <span className="text-green-600 text-sm font-medium px-4 py-2">
                                                    ✓ Rated
                                                </span>
                                            )}
                                            {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                                                <>
                                                    <Link
                                                        href={`/video-consultations?appointmentId=${appointment._id}`}
                                                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center"
                                                    >
                                                        Join Video Call
                                                    </Link>
                                                    <button
                                                        onClick={() => cancelAppointment(appointment._id)}
                                                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📅</div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Appointments</h3>
                            <p className="text-gray-600 mb-6">You don't have any appointments scheduled yet</p>
                            <Link
                                href="/patient/book-appointment"
                                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                            >
                                Book Your First Appointment
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Rating Modal */}
            {showRatingModal && selectedAppointment && (
                <RatingModal
                    appointment={selectedAppointment}
                    onClose={() => {
                        setShowRatingModal(false);
                        setSelectedAppointment(null);
                    }}
                    onSubmit={(rating) => {
                        setShowRatingModal(false);
                        setSelectedAppointment(null);
                        fetchAppointments(); // Refresh appointments
                        alert('Thank you for your feedback!');
                    }}
                />
            )}
        </div>
    );
}