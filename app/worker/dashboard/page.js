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
    const [activeTab, setActiveTab] = useState('overview');

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
                setPatients(patientsData.users || []);
            }

            if (appointmentsRes.ok) {
                const appointmentsData = await appointmentsRes.json();
                setAppointments(appointmentsData.appointments || []);
            }

            if (notificationsRes.ok) {
                const notificationsData = await notificationsRes.json();
                setNotifications(notificationsData.notifications || []);
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
                // Create a nice notification instead of alert
                showNotification(`Appointment ${status} successfully!`, 'success');
                fetchData();
            }
        } catch (error) {
            console.error('Error updating appointment:', error);
            showNotification('Error updating appointment', 'error');
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
                showNotification('Patient assigned successfully!', 'success');
                fetchData();
            }
        } catch (error) {
            console.error('Error assigning patient:', error);
            showNotification('Error assigning patient', 'error');
        }
    };

    const showNotification = (message, type) => {
        // Simple notification system - you could integrate with a toast library
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg animate-fadeIn ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="loading-shimmer w-16 h-16 rounded-full mx-auto mb-4"></div>
                    <div className="text-xl text-gray-600 animate-pulse-custom">Loading Dashboard...</div>
                </div>
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Enhanced Header */}
            <header className="glass shadow-lg sticky top-0 z-40 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse-custom">
                                <span className="text-white font-bold text-lg">👨‍⚕️</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Health Worker Dashboard
                                </h1>
                                <p className="text-sm text-gray-600">Manage your patients and appointments</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center notification-badge">
                                    <span className="text-white text-xs">🔔</span>
                                </div>
                                {notifications.filter(n => !n.isRead).length > 0 && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs">{notifications.filter(n => !n.isRead).length}</span>
                                    </div>
                                )}
                            </div>
                            <div className="hidden md:block">
                                <span className="text-gray-700 font-medium">Welcome, {session?.user?.name}</span>
                                <p className="text-sm text-gray-500">{session?.user?.specialization}</p>
                            </div>
                            <button
                                onClick={() => signOut({
                                    callbackUrl: '/',
                                    redirect: true
                                })}
                                className="btn-animated bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* Navigation Tabs */}
                <div className="mb-8">
                    <div className="flex space-x-1 bg-white/30 backdrop-blur-md p-1 rounded-xl">
                        {[
                            { id: 'overview', label: '📊 Overview', icon: '📊' },
                            { id: 'appointments', label: '📅 Appointments', icon: '📅' },
                            { id: 'patients', label: '👥 Patients', icon: '👥' },
                            { id: 'chat', label: '💬 Chat', icon: '💬' },
                            { id: 'schedule', label: '⏰ Schedule', icon: '⏰' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
                                    }`}
                            >
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden text-lg">{tab.icon}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="animate-fadeIn">
                        {/* Enhanced Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {[
                                {
                                    title: 'My Patients',
                                    value: patients.length,
                                    icon: '👥',
                                    color: 'from-blue-500 to-blue-600',
                                    bgColor: 'bg-blue-50'
                                },
                                {
                                    title: 'Pending Requests',
                                    value: pendingAppointments.length,
                                    icon: '⏰',
                                    color: 'from-orange-500 to-orange-600',
                                    bgColor: 'bg-orange-50'
                                },
                                {
                                    title: "Today's Appointments",
                                    value: todayAppointments.length,
                                    icon: '📅',
                                    color: 'from-green-500 to-green-600',
                                    bgColor: 'bg-green-50'
                                },
                                {
                                    title: 'New Notifications',
                                    value: notifications.filter(n => !n.isRead).length,
                                    icon: '🔔',
                                    color: 'from-purple-500 to-purple-600',
                                    bgColor: 'bg-purple-50'
                                }
                            ].map((stat, index) => (
                                <div key={index} className={`${stat.bgColor} overflow-hidden shadow-lg rounded-xl card-hover animate-fadeIn`} style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                                                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                                            </div>
                                            <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center text-white text-xl animate-bounce-custom`}>
                                                {stat.icon}
                                            </div>
                                        </div>
                                        <div className={`mt-4 h-2 bg-gradient-to-r ${stat.color} rounded-full`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Appointments Tab */}
                {activeTab === 'appointments' && (
                    <div className="animate-fadeIn">
                        <div className="bg-white/80 backdrop-blur-md overflow-hidden shadow-xl rounded-2xl">
                            <div className="px-6 py-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                    <span className="mr-3 text-3xl">📋</span>
                                    Pending Appointment Requests
                                </h3>
                                <div className="space-y-6">
                                    {pendingAppointments.map((appointment, index) => (
                                        <div key={appointment._id} className="border border-gray-200 rounded-xl p-6 card-hover bg-white/60 backdrop-blur-sm animate-slideIn" style={{ animationDelay: `${index * 0.1}s` }}>
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{appointment.title}</h4>
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-gray-600 flex items-center">
                                                            <span className="mr-2">👤</span>
                                                            Patient: {appointment.patient?.name || 'Unknown'}
                                                        </p>
                                                        <p className="text-sm text-gray-600 flex items-center">
                                                            <span className="mr-2">🏥</span>
                                                            Type: {appointment.appointmentType}
                                                        </p>
                                                        <p className="text-sm text-gray-500 flex items-center">
                                                            <span className="mr-2">📅</span>
                                                            {new Date(appointment.scheduledDate).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    {appointment.description && (
                                                        <p className="text-sm text-gray-700 mt-3 p-3 bg-gray-50 rounded-lg">
                                                            {appointment.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2 lg:flex-col lg:space-y-2">
                                                    <button
                                                        onClick={() => handleAppointmentAction(appointment._id, 'approved')}
                                                        className="btn-animated bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                                                    >
                                                        <span>✅</span>
                                                        <span>Approve</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const response = prompt('Reason for rejection (optional):');
                                                            handleAppointmentAction(appointment._id, 'rejected', response || '');
                                                        }}
                                                        className="btn-animated bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                                                    >
                                                        <span>❌</span>
                                                        <span>Reject</span>
                                                    </button>
                                                    <Link
                                                        href={`/chat/${appointment.patient?._id}`}
                                                        className="btn-animated bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                                                    >
                                                        <span>💬</span>
                                                        <span>Chat</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {pendingAppointments.length === 0 && (
                                        <div className="text-center py-12">
                                            <div className="text-6xl mb-4">🎉</div>
                                            <p className="text-gray-500 text-lg">No pending appointment requests</p>
                                            <p className="text-gray-400 text-sm">All caught up!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Patients Tab */}
                {activeTab === 'patients' && (
                    <div className="animate-fadeIn">
                        <div className="bg-white/80 backdrop-blur-md overflow-hidden shadow-xl rounded-2xl">
                            <div className="px-6 py-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                    <span className="mr-3 text-3xl">👥</span>
                                    Available Patients
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {patients.map((patient, index) => (
                                        <div key={patient._id} className="card-hover bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-6 animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                                            <div className="flex items-center mb-4">
                                                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {patient.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-3">
                                                    <h4 className="font-semibold text-gray-800">{patient.name}</h4>
                                                    <p className="text-sm text-gray-500">{patient.email}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 mb-4">
                                                <p className="text-sm text-gray-600 flex items-center">
                                                    <span className="mr-2">🎂</span>
                                                    Age: {patient.age}
                                                </p>
                                                <p className="text-sm text-gray-600 flex items-center">
                                                    <span className="mr-2">{patient.gender === 'male' ? '👨' : '👩'}</span>
                                                    Gender: {patient.gender}
                                                </p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => assignPatient(patient._id)}
                                                    className="flex-1 btn-animated bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
                                                >
                                                    Connect
                                                </button>
                                                <Link
                                                    href={`/chat/${patient._id}`}
                                                    className="flex-1 btn-animated bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium text-center"
                                                >
                                                    Chat
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {patients.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="text-6xl mb-4">👥</div>
                                        <p className="text-gray-500 text-lg">No patients available</p>
                                        <p className="text-gray-400 text-sm">Patients will appear here once they join</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && (
                    <div className="animate-fadeIn">
                        <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl">
                            <div className="px-6 py-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                                        <span className="mr-3 text-3xl">💬</span>
                                        Patient Chat
                                    </h3>
                                    <div className="flex space-x-3">
                                        <Link
                                            href="/chat"
                                            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-4 py-2 rounded-full font-medium btn-animated"
                                        >
                                            View All Chats
                                        </Link>
                                        <Link
                                            href="/video-consultations"
                                            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-4 py-2 rounded-full font-medium btn-animated"
                                        >
                                            Video Calls
                                        </Link>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {patients.slice(0, 6).map((patient, index) => (
                                        <Link
                                            key={patient._id}
                                            href={`/chat/${patient._id}`}
                                            className="block p-4 bg-white/60 backdrop-blur-sm rounded-xl card-hover animate-slideIn border border-gray-200"
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                    {patient.name?.charAt(0).toUpperCase() || 'P'}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-800">{patient.name}</h4>
                                                    <p className="text-sm text-gray-600">{patient.email}</p>
                                                </div>
                                                <div className="text-green-500">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {patients.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="text-6xl mb-4">💬</div>
                                        <p className="text-gray-500 text-lg">No patients to chat with</p>
                                        <p className="text-gray-400 text-sm">Patient chats will appear here once they join</p>
                                    </div>
                                )}

                                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-800 mb-2">💡 Chat Features:</h4>
                                    <ul className="text-blue-700 text-sm space-y-1">
                                        <li>• Real-time messaging with patients</li>
                                        <li>• Secure and private conversations</li>
                                        <li>• Quick access from appointment cards</li>
                                        <li>• Professional communication platform</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Schedule Tab */}
                {activeTab === 'schedule' && (
                    <div className="animate-fadeIn">
                        <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl">
                            <div className="px-6 py-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                    <span className="mr-3 text-3xl">📅</span>
                                    Today's Schedule
                                </h3>
                                <div className="space-y-4">
                                    {todayAppointments.map((appointment, index) => (
                                        <div key={appointment._id} className="flex items-center justify-between p-6 border border-gray-200 rounded-xl card-hover bg-white/60 backdrop-blur-sm animate-slideIn" style={{ animationDelay: `${index * 0.1}s` }}>
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white">
                                                    📅
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800">{appointment.title}</h4>
                                                    <p className="text-sm text-gray-600">
                                                        Patient: {appointment.patient?.name || 'Unknown'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(appointment.scheduledDate).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${appointment.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {appointment.status}
                                                </span>
                                                {appointment.status === 'approved' && (
                                                    <button
                                                        onClick={() => handleAppointmentAction(appointment._id, 'completed')}
                                                        className="btn-animated bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                                    >
                                                        Mark Complete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {todayAppointments.length === 0 && (
                                        <div className="text-center py-12">
                                            <div className="text-6xl mb-4">🏖️</div>
                                            <p className="text-gray-500 text-lg">No appointments scheduled for today</p>
                                            <p className="text-gray-400 text-sm">Enjoy your free time!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}