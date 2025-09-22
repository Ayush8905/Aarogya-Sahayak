'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WorkerDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/auth/signin');
            return;
        }

        if (session.user.role !== 'worker') {
            router.push('/patient/dashboard');
            return;
        }

        fetchData();
    }, [session, status]);

    const fetchData = async () => {
        try {
            const [patientsRes, appointmentsRes, notificationsRes] = await Promise.all([
                fetch('/api/users?role=patient'),
                fetch('/api/appointments'),
                fetch('/api/notifications')
            ]);

            if (patientsRes.ok) {
                const patientsData = await patientsRes.json();
                setPatients(patientsData.users);
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

    const handleAppointmentAction = async (appointmentId, status, response = '') => {
        try {
            const res = await fetch(`/api/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status,
                    workerResponse: response
                })
            });

            if (res.ok) {
                alert(`Appointment ${status} successfully!`);
                fetchData();
            }
        } catch (error) {
            console.error('Error updating appointment:', error);
        }
    };

    const assignPatient = async (patientId) => {
        try {
            const response = await fetch('/api/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'assign',
                    targetUserId: patientId
                })
            });

            if (response.ok) {
                alert('Patient assigned successfully!');
                fetchData();
            }
        } catch (error) {
            console.error('Error assigning patient:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
    const todayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduledDate).toDateString();
        const today = new Date().toDateString();
        return aptDate === today;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold">Health Worker Dashboard</h1>
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
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="text-2xl">👥</div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            My Patients
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {patients.length}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="text-2xl">⏰</div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Pending Requests
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {pendingAppointments.length}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="text-2xl">📅</div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Today's Appointments
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {todayAppointments.length}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="text-2xl">🔔</div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            New Notifications
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {notifications.filter(n => !n.isRead).length}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pending Appointment Requests */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Pending Appointment Requests
                            </h3>
                            <div className="space-y-4">
                                {pendingAppointments.map((appointment) => (
                                    <div key={appointment._id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-medium">{appointment.title}</h4>
                                                <p className="text-sm text-gray-600">
                                                    Patient: {appointment.patient.name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Type: {appointment.appointmentType}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(appointment.scheduledDate).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        {appointment.description && (
                                            <p className="text-sm text-gray-700 mb-3">
                                                {appointment.description}
                                            </p>
                                        )}
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleAppointmentAction(appointment._id, 'approved')}
                                                className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const response = prompt('Reason for rejection (optional):');
                                                    handleAppointmentAction(appointment._id, 'rejected', response || '');
                                                }}
                                                className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                            >
                                                Reject
                                            </button>
                                            <Link
                                                href={`/chat/${appointment.patient._id}`}
                                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                            >
                                                Chat
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                                {pendingAppointments.length === 0 && (
                                    <p className="text-gray-500 text-center py-4">
                                        No pending appointment requests
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* My Patients */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Available Patients
                            </h3>
                            <div className="space-y-3">
                                {patients.map((patient) => (
                                    <div key={patient._id} className="border rounded-lg p-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium">{patient.name}</h4>
                                                <p className="text-sm text-gray-600">
                                                    Age: {patient.age}, Gender: {patient.gender}
                                                </p>
                                                <p className="text-sm text-gray-500">{patient.email}</p>
                                            </div>
                                            <div className="space-x-2">
                                                <button
                                                    onClick={() => assignPatient(patient._id)}
                                                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                                >
                                                    Connect
                                                </button>
                                                <Link
                                                    href={`/chat/${patient._id}`}
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
                </div>

                {/* Today's Schedule */}
                <div className="mt-8 bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                            Today's Schedule
                        </h3>
                        <div className="space-y-3">
                            {todayAppointments.map((appointment) => (
                                <div key={appointment._id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <h4 className="font-medium">{appointment.title}</h4>
                                        <p className="text-sm text-gray-600">
                                            Patient: {appointment.patient.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(appointment.scheduledDate).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${appointment.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {appointment.status}
                                        </span>
                                        {appointment.status === 'approved' && (
                                            <button
                                                onClick={() => handleAppointmentAction(appointment._id, 'completed')}
                                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                            >
                                                Mark Complete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {todayAppointments.length === 0 && (
                                <p className="text-gray-500 text-center py-4">
                                    No appointments scheduled for today
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}