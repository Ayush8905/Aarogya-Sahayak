'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HealthRecordsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
            return;
        }
        fetchHealthRecords();
    }, [session, status]);

    const fetchHealthRecords = async () => {
        try {
            // Mock data for now since we don't have a health records API yet
            const mockRecords = [
                {
                    _id: '1',
                    date: '2024-10-01',
                    type: 'General Checkup',
                    provider: 'Dr. John Smith',
                    diagnosis: 'Routine health checkup - All normal',
                    medications: ['Vitamin D supplement'],
                    notes: 'Patient is in good health. Continue regular exercise and balanced diet.'
                },
                {
                    _id: '2',
                    date: '2024-09-15',
                    type: 'Blood Test',
                    provider: 'Lab Tech Mary Johnson',
                    diagnosis: 'Blood work results',
                    medications: [],
                    notes: 'All blood parameters within normal range. Cholesterol slightly elevated.'
                }
            ];

            setTimeout(() => {
                setRecords(mockRecords);
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error fetching health records:', error);
            setLoading(false);
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
                                ← Health Records
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
                        <h2 className="text-2xl font-bold text-gray-800">Health Records</h2>
                        <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            + Add Record
                        </button>
                    </div>

                    {records.length > 0 ? (
                        <div className="space-y-6">
                            {records.map((record) => (
                                <div key={record._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mr-4">
                                                <span className="text-white text-xl">🏥</span>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800">{record.type}</h3>
                                                <p className="text-gray-600">{new Date(record.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                            Complete
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-2">Healthcare Provider</h4>
                                            <p className="text-gray-900 mb-4">{record.provider}</p>

                                            <h4 className="font-semibold text-gray-700 mb-2">Diagnosis/Results</h4>
                                            <p className="text-gray-900">{record.diagnosis}</p>
                                        </div>

                                        <div>
                                            {record.medications && record.medications.length > 0 && (
                                                <div className="mb-4">
                                                    <h4 className="font-semibold text-gray-700 mb-2">Medications</h4>
                                                    <ul className="list-disc list-inside text-gray-900">
                                                        {record.medications.map((med, index) => (
                                                            <li key={index}>{med}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <h4 className="font-semibold text-gray-700 mb-2">Notes</h4>
                                            <p className="text-gray-900 text-sm">{record.notes}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-4 space-x-2">
                                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                            View Details
                                        </button>
                                        <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                            Download PDF
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🏥</div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Health Records</h3>
                            <p className="text-gray-600 mb-6">Your medical records will appear here once you have consultations</p>
                            <Link
                                href="/appointments"
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                            >
                                Book Appointment
                            </Link>
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="glass p-6 rounded-2xl text-center">
                        <div className="text-3xl mb-2">📊</div>
                        <h3 className="text-lg font-bold text-gray-800">Total Records</h3>
                        <p className="text-2xl font-bold text-blue-600">{records.length}</p>
                    </div>
                    <div className="glass p-6 rounded-2xl text-center">
                        <div className="text-3xl mb-2">💊</div>
                        <h3 className="text-lg font-bold text-gray-800">Active Medications</h3>
                        <p className="text-2xl font-bold text-green-600">
                            {records.reduce((total, record) => total + (record.medications?.length || 0), 0)}
                        </p>
                    </div>
                    <div className="glass p-6 rounded-2xl text-center">
                        <div className="text-3xl mb-2">📅</div>
                        <h3 className="text-lg font-bold text-gray-800">Last Visit</h3>
                        <p className="text-sm font-medium text-gray-600">
                            {records.length > 0 ? new Date(records[0].date).toLocaleDateString() : 'Never'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}