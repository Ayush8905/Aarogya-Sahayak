'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PatientDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [workers, setWorkers] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
            return;
        }
        if (session.user.role !== 'patient') {
            router.push('/worker/dashboard');
            return;
        }
        fetchData();
    }, [session, status]);

    const fetchData = async () => {
        try {
            setError(null);
            console.log('🔍 Fetching data for user:', session?.user?.email);

            const [workersRes, appointmentsRes, notificationsRes] = await Promise.all([
                fetch('/api/users?role=worker', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                }),
                fetch('/api/appointments', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                }),
                fetch('/api/notifications', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                })
            ]);

            console.log('📊 API Response Status:', {
                workers: workersRes.status,
                appointments: appointmentsRes.status,
                notifications: notificationsRes.status
            });

            // Handle workers response
            if (workersRes.ok) {
                const workersData = await workersRes.json();
                console.log('👨‍⚕️ Workers data received:', workersData);
                const workersArray = workersData.users || workersData || [];
                console.log('👨‍⚕️ Workers array:', workersArray);
                setWorkers(workersArray);
            } else {
                console.error('❌ Workers API failed:', workersRes.status, await workersRes.text());
                setError('Failed to load healthcare workers');
            }

            // Handle appointments response
            if (appointmentsRes.ok) {
                const appointmentsData = await appointmentsRes.json();
                console.log('📅 Appointments data:', appointmentsData);
                const appointmentsArray = appointmentsData.appointments || appointmentsData || [];
                setAppointments(appointmentsArray);
            } else {
                console.error('❌ Appointments API failed:', appointmentsRes.status, await appointmentsRes.text());
            }

            // Handle notifications response
            if (notificationsRes.ok) {
                const notificationsData = await notificationsRes.json();
                console.log('🔔 Notifications data:', notificationsData);
                const notificationsArray = notificationsData.notifications || notificationsData || [];
                setNotifications(notificationsArray);
            } else {
                console.error('❌ Notifications API failed:', notificationsRes.status, await notificationsRes.text());
            }
        } catch (error) {
            console.error('❌ Error fetching data:', error);
            setError('Network error: Unable to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const bookAppointment = async (workerId) => {
        try {
            console.log('📅 Booking appointment with worker:', workerId);
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    workerId,
                    title: 'General Consultation',
                    description: 'General health consultation appointment',
                    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    duration: 30,
                    appointmentType: 'consultation'
                }),
            });

            const responseData = await response.json();
            console.log('📅 Appointment booking response:', responseData);

            if (response.ok) {
                alert('Appointment booked successfully!');
                fetchData(); // Refresh data
            } else {
                console.error('❌ Appointment booking failed:', responseData);
                alert(`Failed to book appointment: ${responseData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error booking appointment:', error);
            alert('Network error: Unable to book appointment');
        }
    };

    const handleSignOut = () => { signOut({ callbackUrl: '/' }); };

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
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                            Aarogya Sahayak
                        </h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Welcome, {session.user.name}</span>
                            <button onClick={handleSignOut} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Link href="/appointments" className="glass p-6 rounded-2xl card-hover group">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-3">
                                <span className="text-white text-xl">📅</span>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-1">My Appointments</h3>
                            <p className="text-sm text-gray-600">View & manage</p>
                        </div>
                    </Link>
                    <Link href="/video-consultations" className="glass p-6 rounded-2xl card-hover group">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-3">
                                <span className="text-white text-xl">📹</span>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-1">Video Consultation</h3>
                            <p className="text-sm text-gray-600">Connect via video</p>
                        </div>
                    </Link>
                    <Link href="/health-records" className="glass p-6 rounded-2xl card-hover group">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mb-3">
                                <span className="text-white text-xl">🏥</span>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-1">Health Records</h3>
                            <p className="text-sm text-gray-600">Medical history</p>
                        </div>
                    </Link>
                    <Link href="/emergency" className="glass p-6 rounded-2xl card-hover group">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mb-3">
                                <span className="text-white text-xl">🚨</span>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-1">Emergency</h3>
                            <p className="text-sm text-gray-600">Urgent help</p>
                        </div>
                    </Link>
                </div>
                {/* Error Display */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        <p className="font-bold">Error:</p>
                        <p>{error}</p>
                        <button
                            onClick={fetchData}
                            className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                            Retry
                        </button>
                    </div>
                )}

                <div className="glass p-6 rounded-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Available Healthcare Workers</h2>
                        <button
                            onClick={fetchData}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                            Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading healthcare workers...</p>
                        </div>
                    ) : workers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {workers.map((worker) => (
                                <div key={worker._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-center mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">{worker.name?.charAt(0) || 'D'}</span>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="font-bold text-gray-800">{worker.name || 'Unknown Doctor'}</h3>
                                            <p className="text-sm text-gray-600">{worker.specialization || 'General Medicine'}</p>
                                            <p className="text-xs text-gray-500">{worker.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => bookAppointment(worker._id)}
                                        className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                    >
                                        Book Appointment
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-6xl mb-4">👨‍⚕️</div>
                            <p className="text-gray-600 mb-4">No healthcare workers found</p>
                            <button
                                onClick={fetchData}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
