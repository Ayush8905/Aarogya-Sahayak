'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ConnectionTest() {
    const { data: session } = useSession();
    const [connectionStatus, setConnectionStatus] = useState({
        database: 'checking',
        socket: 'checking',
        apis: 'checking'
    });
    const [testResults, setTestResults] = useState([]);

    useEffect(() => {
        if (session) {
            runConnectionTests();
        }
    }, [session]);

    const addTestResult = (test, status, message) => {
        setTestResults(prev => [...prev, { test, status, message, time: new Date().toLocaleTimeString() }]);
    };

    const runConnectionTests = async () => {
        // Test 1: Database connection through API
        try {
            const response = await fetch('/api/users?role=worker');
            if (response.ok) {
                const data = await response.json();
                if (data.users && data.users.length > 0) {
                    addTestResult('Database', 'success', `Found ${data.users.length} workers`);
                    setConnectionStatus(prev => ({ ...prev, database: 'connected' }));
                } else {
                    addTestResult('Database', 'warning', 'Mock data returned (database not connected)');
                    setConnectionStatus(prev => ({ ...prev, database: 'mock' }));
                }
            } else {
                addTestResult('Database', 'error', 'Failed to fetch users');
                setConnectionStatus(prev => ({ ...prev, database: 'error' }));
            }
        } catch (error) {
            addTestResult('Database', 'error', error.message);
            setConnectionStatus(prev => ({ ...prev, database: 'error' }));
        }

        // Test 2: Appointment API
        try {
            const response = await fetch('/api/appointments');
            if (response.ok) {
                addTestResult('Appointments API', 'success', 'API accessible');
            } else {
                addTestResult('Appointments API', 'error', 'API failed');
            }
        } catch (error) {
            addTestResult('Appointments API', 'error', error.message);
        }

        // Test 3: Messages API
        try {
            const response = await fetch('/api/messages?userId=test-user');
            if (response.ok) {
                addTestResult('Messages API', 'success', 'API accessible');
            } else {
                addTestResult('Messages API', 'error', 'API failed');
            }
        } catch (error) {
            addTestResult('Messages API', 'error', error.message);
        }

        // Test 4: Socket connection
        try {
            if (typeof window !== 'undefined') {
                const io = await import('socket.io-client');
                const currentPort = window.location.port || '3000';
                const socket = io.default(`http://localhost:${currentPort}`, {
                    path: '/api/socket',
                    timeout: 5000
                });

                socket.on('connect', () => {
                    addTestResult('Socket.io', 'success', 'Connected successfully');
                    setConnectionStatus(prev => ({ ...prev, socket: 'connected' }));
                    socket.disconnect();
                });

                socket.on('connect_error', (error) => {
                    addTestResult('Socket.io', 'error', error.message);
                    setConnectionStatus(prev => ({ ...prev, socket: 'error' }));
                });

                setTimeout(() => {
                    if (!socket.connected) {
                        addTestResult('Socket.io', 'warning', 'Connection timeout');
                        setConnectionStatus(prev => ({ ...prev, socket: 'timeout' }));
                        socket.disconnect();
                    }
                }, 5000);
            }
        } catch (error) {
            addTestResult('Socket.io', 'error', error.message);
            setConnectionStatus(prev => ({ ...prev, socket: 'error' }));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'connected':
            case 'success':
                return 'text-green-600';
            case 'mock':
            case 'warning':
                return 'text-yellow-600';
            case 'error':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'connected':
            case 'success':
                return '✅';
            case 'mock':
            case 'warning':
                return '⚠️';
            case 'error':
                return '❌';
            default:
                return '🔄';
        }
    };

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Please sign in to test connections</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Connection Test Dashboard</h1>
                    <p className="text-gray-600 mb-6">Testing all connections for {session.user.name} ({session.user.role})</p>

                    {/* Connection Status Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-700 mb-2">Database Connection</h3>
                            <div className={`flex items-center ${getStatusColor(connectionStatus.database)}`}>
                                <span className="mr-2">{getStatusIcon(connectionStatus.database)}</span>
                                <span className="capitalize">{connectionStatus.database}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-700 mb-2">Socket.io Connection</h3>
                            <div className={`flex items-center ${getStatusColor(connectionStatus.socket)}`}>
                                <span className="mr-2">{getStatusIcon(connectionStatus.socket)}</span>
                                <span className="capitalize">{connectionStatus.socket}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-700 mb-2">API Status</h3>
                            <div className={`flex items-center ${getStatusColor(connectionStatus.apis)}`}>
                                <span className="mr-2">{getStatusIcon(connectionStatus.apis)}</span>
                                <span className="capitalize">{connectionStatus.apis}</span>
                            </div>
                        </div>
                    </div>

                    {/* Test Results */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-700 mb-4">Test Results</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {testResults.map((result, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                    <div className="flex items-center">
                                        <span className="mr-3">{getStatusIcon(result.status)}</span>
                                        <span className="font-medium">{result.test}:</span>
                                        <span className={`ml-2 ${getStatusColor(result.status)}`}>{result.message}</span>
                                    </div>
                                    <span className="text-sm text-gray-500">{result.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex gap-4">
                        <button
                            onClick={() => {
                                setTestResults([]);
                                setConnectionStatus({ database: 'checking', socket: 'checking', apis: 'checking' });
                                runConnectionTests();
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                        >
                            Rerun Tests
                        </button>

                        <button
                            onClick={() => window.location.href = `/${session.user.role}/dashboard`}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}