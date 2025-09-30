'use client';

import { useSession } from 'next-auth/react';

export default function SessionTest() {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return <div className="p-8">Loading session...</div>;
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Session Debug Page</h1>
            <div className="bg-gray-100 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Session Status: {status}</h2>
                <pre className="text-sm overflow-auto">
                    {JSON.stringify(session, null, 2)}
                </pre>
            </div>

            {session && (
                <div className="mt-4 bg-blue-100 p-4 rounded-lg">
                    <h3 className="font-semibold">Quick Access:</h3>
                    <p>User ID: {session.user?.id}</p>
                    <p>User Name: {session.user?.name}</p>
                    <p>User Email: {session.user?.email}</p>
                    <p>User Role: {session.user?.role}</p>
                </div>
            )}
        </div>
    );
}