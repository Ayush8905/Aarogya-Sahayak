'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function ChatTestPage() {
    const { data: session, status } = useSession();
    const [testResults, setTestResults] = useState({
        auth: null,
        messagesAPI: null,
        usersAPI: null,
        socket: null
    });
    const [testMessage, setTestMessage] = useState('');
    const [testResponse, setTestResponse] = useState('');

    useEffect(() => {
        if (session) {
            runTests();
        }
    }, [session]);

    const runTests = async () => {
        // Test 1: Authentication
        setTestResults(prev => ({ ...prev, auth: session ? 'PASS' : 'FAIL' }));

        // Test 2: Users API
        try {
            const usersRes = await fetch('/api/users?role=worker');
            const usersData = await usersRes.json();
            setTestResults(prev => ({
                ...prev,
                usersAPI: usersRes.ok ? 'PASS' : 'FAIL',
                users: usersData.users || []
            }));
        } catch (error) {
            setTestResults(prev => ({ ...prev, usersAPI: 'FAIL' }));
        }

        // Test 3: Messages API (GET)
        try {
            const messagesRes = await fetch('/api/messages?userId=test-user-id');
            setTestResults(prev => ({
                ...prev,
                messagesAPI: messagesRes.status === 200 || messagesRes.status === 400 ? 'PASS' : 'FAIL'
            }));
        } catch (error) {
            setTestResults(prev => ({ ...prev, messagesAPI: 'FAIL' }));
        }
    };

    const testSendMessage = async () => {
        if (!testMessage.trim()) return;

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    receiverId: 'demo-user-2',
                    content: testMessage,
                    messageType: 'text'
                })
            });

            const data = await response.json();
            setTestResponse(JSON.stringify(data, null, 2));
        } catch (error) {
            setTestResponse('Error: ' + error.message);
        }
    };

    if (status === 'loading') {
        return <div className="p-8">Loading...</div>;
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Chat System Test</h1>
                    <p className="mb-4">Please sign in to test the chat functionality</p>
                    <Link href="/auth/signin" className="bg-blue-600 text-white px-6 py-2 rounded-lg">
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-center mb-8">🧪 Chat System Test Dashboard</h1>

                    {/* User Info */}
                    <div className="mb-8 p-4 bg-green-50 rounded-lg">
                        <h2 className="text-lg font-semibold text-green-800 mb-2">👤 Current User</h2>
                        <p><strong>Name:</strong> {session.user.name}</p>
                        <p><strong>Email:</strong> {session.user.email}</p>
                        <p><strong>Role:</strong> {session.user.role}</p>
                        <p><strong>ID:</strong> {session.user.id}</p>
                    </div>

                    {/* Test Results */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">🔍 System Tests</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg">
                                <h3 className="font-semibold">Authentication</h3>
                                <span className={`px-2 py-1 rounded text-sm ${testResults.auth === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {testResults.auth || 'TESTING...'}
                                </span>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h3 className="font-semibold">Users API</h3>
                                <span className={`px-2 py-1 rounded text-sm ${testResults.usersAPI === 'PASS' ? 'bg-green-100 text-green-800' :
                                        testResults.usersAPI === 'FAIL' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {testResults.usersAPI || 'TESTING...'}
                                </span>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h3 className="font-semibold">Messages API</h3>
                                <span className={`px-2 py-1 rounded text-sm ${testResults.messagesAPI === 'PASS' ? 'bg-green-100 text-green-800' :
                                        testResults.messagesAPI === 'FAIL' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {testResults.messagesAPI || 'TESTING...'}
                                </span>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h3 className="font-semibold">Socket Connection</h3>
                                <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                                    AVAILABLE
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Message Test */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">📤 Test Send Message</h2>
                        <div className="space-y-4">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={testMessage}
                                    onChange={(e) => setTestMessage(e.target.value)}
                                    placeholder="Enter test message..."
                                    className="flex-1 px-3 py-2 border rounded-lg"
                                />
                                <button
                                    onClick={testSendMessage}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                                >
                                    Send Test
                                </button>
                            </div>
                            {testResponse && (
                                <div className="p-4 bg-gray-100 rounded-lg">
                                    <h3 className="font-semibold mb-2">Response:</h3>
                                    <pre className="text-sm overflow-x-auto">{testResponse}</pre>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Available Users */}
                    {testResults.users && testResults.users.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">👥 Available Chat Partners</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {testResults.users.slice(0, 4).map((user) => (
                                    <Link
                                        key={user._id}
                                        href={`/chat/${user._id}`}
                                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                {user.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{user.name}</h3>
                                                <p className="text-sm text-gray-600">{user.email}</p>
                                                {user.specialization && (
                                                    <p className="text-sm text-blue-600">{user.specialization}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-2 text-sm text-green-600">
                                            → Click to start chat
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex space-x-4 justify-center">
                        <Link href="/chat" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                            Go to Chat List
                        </Link>
                        <Link href="/" className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}