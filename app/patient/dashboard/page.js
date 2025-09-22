'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PatientDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [workers, setWorkers] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

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
            const [workersRes, appointmentsRes, notificationsRes] = await Promise.all([
                fetch('/api/users?role=worker'),
                fetch('/api/appointments'),
                fetch('/api/notifications')
            ]);

            if (workersRes.ok) {
                const workersData = await workersRes.json();
                setWorkers(workersData.users);
            }

            if (appointmentsRes.ok) {
                const appointmentsData = await appointmentsRes.json();
                setAppointments(appointmentsData.appointments);
            }

            if (notificationsRes.ok) {
                const notificationsData = await notificationsRes.json();
                setNotifications(notificationsData.notifications);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const assignWorker = async (workerId) => {
        try {
            const response = await fetch('/api/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'assign',
                    targetUserId: workerId
                })
            });

            if (response.ok) {
                alert('Worker assigned successfully!');
                fetchData();
            }
        } catch (error) {
            console.error('Error assigning worker:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold">Patient Dashboard</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span>Welcome, {session?.user?.name}</span>
                            <button
                                onClick={() => signOut()}
                                className="text-red-600 hover:text-red-800"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Available Health Workers */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Available Health Workers
                            </h3>
                            <div className="space-y-3">
                                {workers.map((worker) => (
                                    <div key={worker._id} className="border rounded-lg p-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium">{worker.name}</h4>
                                                <p className="text-sm text-gray-600">{worker.specialization}</p>
                                                <p className="text-xs text-gray-500">{worker.experience} years exp.</p>
                                            </div>
                                            <div className="space-x-2">
                                                <button
                                                    onClick={() => assignWorker(worker._id)}
                                                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                                >
                                                    Connect
                                                </button>
                                                <Link
                                                    href={`/chat/${worker._id}`}
                                                    className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 inline-block"
                                                >
                                                    Chat
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Appointments */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    My Appointments
                                </h3>
                                <Link
                                    href="/patient/book-appointment"
                                    className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                                >
                                    Book New
                                </Link>
                            </div>
                            <div className="space-y-3">
                                {appointments.slice(0, 5).map((appointment) => (
                                    <div key={appointment._id} className="border rounded-lg p-3">
                                        <h4 className="font-medium">{appointment.title}</h4>
                                        <p className="text-sm text-gray-600">
                                            With: {appointment.worker.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(appointment.scheduledDate).toLocaleString()}
                                        </p>
                                        <span className={`text-xs px-2 py-1 rounded-full ${appointment.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    appointment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                            {appointment.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Notifications
                            </h3>
                            <div className="space-y-3">
                                {notifications.slice(0, 5).map((notification) => (
                                    <div key={notification._id} className={`border rounded-lg p-3 ${!notification.isRead ? 'bg-blue-50 border-blue-200' : ''
                                        }`}>
                                        <h4 className="font-medium text-sm">{notification.title}</h4>
                                        <p className="text-xs text-gray-600">{notification.message}</p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Link
                                href="/patient/book-appointment"
                                className="text-center p-4 border rounded-lg hover:bg-gray-50"
                            >
                                <div className="text-2xl mb-2">📅</div>
                                <div className="text-sm font-medium">Book Appointment</div>
                            </Link>
                            <Link
                                href="/patient/messages"
                                className="text-center p-4 border rounded-lg hover:bg-gray-50"
                            >
                                <div className="text-2xl mb-2">💬</div>
                                <div className="text-sm font-medium">Messages</div>
                            </Link>
                            <Link
                                href="/patient/health-records"
                                className="text-center p-4 border rounded-lg hover:bg-gray-50"
                            >
                                <div className="text-2xl mb-2">📋</div>
                                <div className="text-sm font-medium">Health Records</div>
                            </Link>
                            <Link
                                href="/patient/emergency"
                                className="text-center p-4 border rounded-lg hover:bg-red-50 border-red-200"
                            >
                                <div className="text-2xl mb-2">🚨</div>
                                <div className="text-sm font-medium text-red-600">Emergency</div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}