'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ChatListPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/auth/signin');
            return;
        }

        fetchUsers();
    }, [session, status]);

    const fetchUsers = async () => {
        try {
            setLoading(true);

            // Fetch different user types based on current user's role
            const targetRole = session?.user?.role === 'patient' ? 'worker' : 'patient';

            const response = await fetch(`/api/users?role=${targetRole}`);
            const data = await response.json();

            if (response.ok) {
                setUsers(data.users || []);
            } else {
                setError(data.error || 'Failed to load users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading conversations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            💬 Chat with {session?.user?.role === 'patient' ? 'Health Workers' : 'Patients'}
                        </h1>
                        <p className="text-gray-600">
                            Connect and communicate with {session?.user?.role === 'patient' ? 'doctors and healthcare professionals' : 'your patients'}
                        </p>
                    </div>

                    {/* Back to Dashboard */}
                    <div className="mb-6">
                        <Link
                            href="/"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Dashboard
                        </Link>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Users List */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            <h2 className="text-xl font-semibold">
                                Available {session?.user?.role === 'patient' ? 'Health Workers' : 'Patients'}
                            </h2>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {users.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <div className="mb-4">
                                        <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-2-2V10a2 2 0 012-2h2m2-4h6a2 2 0 012 2v6a2 2 0 01-2 2h-6m0-4h4m-4 2h4" />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-medium text-gray-700 mb-2">No users available</p>
                                    <p className="text-gray-500">
                                        {session?.user?.role === 'patient'
                                            ? 'No health workers are currently available for chat.'
                                            : 'No patients are currently registered for chat.'
                                        }
                                    </p>
                                </div>
                            ) : (
                                users.map((user) => (
                                    <Link
                                        key={user._id}
                                        href={`/chat/${user._id}`}
                                        className="block hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="p-6 flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                    {user.specialization && (
                                                        <p className="text-sm text-blue-600 font-medium">{user.specialization}</p>
                                                    )}
                                                    {user.phone && (
                                                        <p className="text-sm text-gray-500">📞 {user.phone}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2 text-gray-400">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                <span className="text-sm">Start Chat</span>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="font-semibold text-blue-800 mb-2">💡 How to Start Chatting:</h3>
                        <ul className="text-blue-700 space-y-1">
                            <li>• Click on any {session?.user?.role === 'patient' ? 'health worker' : 'patient'} to start a conversation</li>
                            <li>• Send messages, ask questions, and get real-time responses</li>
                            <li>• All conversations are secure and private</li>
                            <li>• {session?.user?.role === 'patient' ? 'Get medical advice and support' : 'Provide care and guidance to your patients'}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}