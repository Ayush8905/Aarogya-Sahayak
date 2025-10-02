'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EmergencyPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [location, setLocation] = useState(null);
    const [emergencyContacts] = useState([
        { name: 'Ambulance', number: '102', icon: '🚑' },
        { name: 'Fire Brigade', number: '101', icon: '🚒' },
        { name: 'Police', number: '100', icon: '👮' },
        { name: 'Emergency Helpline', number: '112', icon: '📞' }
    ]);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
            return;
        }
        getCurrentLocation();
    }, [session, status]);

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    console.error('Error getting location:', error);
                }
            );
        }
    };

    const sendEmergencyAlert = async () => {
        try {
            const emergencyData = {
                userId: session.user.id,
                location: location,
                timestamp: new Date().toISOString(),
                type: 'medical_emergency'
            };

            // In a real app, this would send to emergency services
            console.log('Emergency alert sent:', emergencyData);
            alert('Emergency alert sent! Help is on the way. Stay calm and follow safety instructions.');
        } catch (error) {
            console.error('Error sending emergency alert:', error);
            alert('Failed to send emergency alert. Please call emergency services directly.');
        }
    };

    const callEmergencyNumber = (number) => {
        window.open(`tel:${number}`, '_self');
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
            <header className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href={session.user.role === 'patient' ? '/patient/dashboard' : '/worker/dashboard'}>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent hover:opacity-80">
                                ← Emergency
                            </h1>
                        </Link>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Welcome, {session.user.name}</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Emergency Alert Button */}
                <div className="glass p-8 rounded-2xl mb-8 text-center bg-gradient-to-r from-red-50 to-red-100">
                    <div className="text-6xl mb-4">🚨</div>
                    <h2 className="text-3xl font-bold text-red-800 mb-4">Medical Emergency?</h2>
                    <p className="text-gray-700 mb-6">Click the button below to send an immediate emergency alert with your location</p>

                    <button
                        onClick={sendEmergencyAlert}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-12 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                    >
                        🚨 SEND EMERGENCY ALERT 🚨
                    </button>

                    {location && (
                        <p className="text-sm text-gray-600 mt-4">
                            📍 Location detected: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </p>
                    )}
                </div>

                {/* Emergency Contacts */}
                <div className="glass p-6 rounded-2xl mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">Emergency Contacts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {emergencyContacts.map((contact, index) => (
                            <button
                                key={index}
                                onClick={() => callEmergencyNumber(contact.number)}
                                className="bg-white hover:bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200 transition-all transform hover:scale-105"
                            >
                                <div className="text-3xl mb-2">{contact.icon}</div>
                                <h4 className="font-bold text-gray-800 mb-1">{contact.name}</h4>
                                <p className="text-2xl font-bold text-red-600">{contact.number}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Safety Instructions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass p-6 rounded-2xl">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">🩺 Medical Emergency Steps</h3>
                        <ul className="space-y-3 text-gray-700">
                            <li className="flex items-start">
                                <span className="bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                                Stay calm and assess the situation
                            </li>
                            <li className="flex items-start">
                                <span className="bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                                Call emergency services (102 for ambulance)
                            </li>
                            <li className="flex items-start">
                                <span className="bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                                Provide clear location information
                            </li>
                            <li className="flex items-start">
                                <span className="bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                                Follow dispatcher instructions
                            </li>
                            <li className="flex items-start">
                                <span className="bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
                                Stay with the patient until help arrives
                            </li>
                        </ul>
                    </div>

                    <div className="glass p-6 rounded-2xl">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">🚨 When to Call Emergency</h3>
                        <ul className="space-y-2 text-gray-700">
                            <li className="flex items-center">
                                <span className="text-red-500 mr-2">•</span>
                                Chest pain or difficulty breathing
                            </li>
                            <li className="flex items-center">
                                <span className="text-red-500 mr-2">•</span>
                                Unconsciousness or unresponsiveness
                            </li>
                            <li className="flex items-center">
                                <span className="text-red-500 mr-2">•</span>
                                Severe bleeding or trauma
                            </li>
                            <li className="flex items-center">
                                <span className="text-red-500 mr-2">•</span>
                                Signs of stroke (F.A.S.T.)
                            </li>
                            <li className="flex items-center">
                                <span className="text-red-500 mr-2">•</span>
                                Severe allergic reactions
                            </li>
                            <li className="flex items-center">
                                <span className="text-red-500 mr-2">•</span>
                                Poisoning or overdose
                            </li>
                            <li className="flex items-center">
                                <span className="text-red-500 mr-2">•</span>
                                Severe burns or injuries
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass p-6 rounded-2xl mt-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link
                            href="/video-consultations"
                            className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg text-center transition-colors"
                        >
                            <div className="text-2xl mb-2">📹</div>
                            <div className="font-medium">Emergency Video Call</div>
                        </Link>
                        <button className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg text-center transition-colors">
                            <div className="text-2xl mb-2">📍</div>
                            <div className="font-medium">Share Location</div>
                        </button>
                        <button className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg text-center transition-colors">
                            <div className="text-2xl mb-2">👥</div>
                            <div className="font-medium">Emergency Contacts</div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}