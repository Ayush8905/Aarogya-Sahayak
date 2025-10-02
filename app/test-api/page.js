'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function TestPage() {
    const { data: session } = useSession();
    const [results, setResults] = useState({
        users: null,
        appointments: null,
        notifications: null,
        debug: null
    });
    const [loading, setLoading] = useState(false);

    const testAPI = async (endpoint, key) => {
        try {
            console.log(`🧪 Testing ${endpoint}`);
            const response = await fetch(endpoint);
            console.log(`📊 ${endpoint} status:`, response.status);

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${endpoint} data:`, data);
                setResults(prev => ({ ...prev, [key]: data }));
            } else {
                const error = await response.text();
                console.error(`❌ ${endpoint} error:`, error);
                setResults(prev => ({ ...prev, [key]: { error: `${response.status}: ${error}` } }));
            }
        } catch (err) {
            console.error(`❌ ${endpoint} exception:`, err);
            setResults(prev => ({ ...prev, [key]: { error: err.message } }));
        }
    };

    const runTests = async () => {
        setLoading(true);
        setResults({ users: null, appointments: null, notifications: null, debug: null });

        await Promise.all([
            testAPI('/api/users?role=worker', 'users'),
            testAPI('/api/appointments', 'appointments'),
            testAPI('/api/notifications', 'notifications'),
            testAPI('/api/debug', 'debug')
        ]);

        setLoading(false);
    };

    useEffect(() => {
        if (session) {
            runTests();
        }
    }, [session]);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">API Test Dashboard</h1>

                <div className="bg-white p-6 rounded-lg shadow mb-8">
                    <h2 className="text-xl font-semibold mb-4">Session Info</h2>
                    {session ? (
                        <div className="bg-green-100 p-4 rounded">
                            <p><strong>Name:</strong> {session.user.name}</p>
                            <p><strong>Email:</strong> {session.user.email}</p>
                            <p><strong>Role:</strong> {session.user.role}</p>
                            <p><strong>ID:</strong> {session.user.id}</p>
                        </div>
                    ) : (
                        <div className="bg-red-100 p-4 rounded">
                            <p>No session found. Please login first.</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={runTests}
                    disabled={loading || !session}
                    className="bg-blue-500 text-white px-6 py-2 rounded mb-8 disabled:opacity-50"
                >
                    {loading ? 'Testing...' : 'Run API Tests'}
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {Object.entries(results).map(([key, data]) => (
                        <div key={key} className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4 capitalize">{key} API</h3>
                            {data ? (
                                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                                    {JSON.stringify(data, null, 2)}
                                </pre>
                            ) : (
                                <p className="text-gray-500">No data</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}