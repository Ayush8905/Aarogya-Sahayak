'use client';
import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignIn() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false
            });

            if (result?.error) {
                setError(result.error);
            } else {
                const session = await getSession();
                if (session?.user?.role === 'patient') {
                    router.push('/patient/dashboard');
                } else if (session?.user?.role === 'worker') {
                    router.push('/worker/dashboard');
                }
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center animate-fadeIn">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-custom">
                        <span className="text-white text-3xl">🩺</span>
                    </div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Welcome Back
                    </h2>
                    <p className="mt-3 text-lg text-gray-600">
                        Sign in to your Aarogya Sahayak account
                    </p>
                </div>

                <div className="glass shadow-2xl rounded-3xl p-8 animate-slideIn">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-fadeIn">
                            <div className="flex items-center space-x-2">
                                <span className="text-red-500 text-lg">❌</span>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                                📧 Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                style={{
                                    color: '#1f2937 !important',
                                    backgroundColor: 'white !important'
                                }}
                            />
                        </div>

                        <div className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                            <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                                🔒 Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                style={{
                                    color: '#1f2937 !important',
                                    backgroundColor: 'white !important'
                                }}
                            />
                        </div>

                        <div className="animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300 btn-animated"
                            >
                                {loading ? (
                                    <>
                                        <div className="loading-shimmer w-5 h-5 rounded-full"></div>
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>🚀</span>
                                        <span>Sign In</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="text-center animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                            <p className="text-sm text-gray-600">
                                Don't have an account?{' '}
                                <Link
                                    href="/auth/signup"
                                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300"
                                >
                                    Sign up here
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>

                {/* Demo Credentials */}
                <div className="glass rounded-2xl p-6 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">
                        🎯 Demo Credentials
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2">👨‍⚕️ Health Worker</h4>
                            <p className="text-blue-700">Email: worker@demo.com</p>
                            <p className="text-blue-700">Password: password123</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                            <h4 className="font-semibold text-green-800 mb-2">🧑‍🦱 Patient</h4>
                            <p className="text-green-700">Email: patient@demo.com</p>
                            <p className="text-green-700">Password: password123</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}