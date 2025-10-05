'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      // Redirect based on user role
      if (session.user.role === 'patient') {
        router.push('/patient/dashboard');
      } else if (session.user.role === 'worker') {
        router.push('/worker/dashboard');
      } else if (session.user.role === 'seller') {
        router.push('/seller/dashboard');
      }
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (session) {
    return null; // Will redirect based on role
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">
                🏥 Aarogya Sahayak
              </h1>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/auth/signin"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Connect with
            <span className="text-indigo-600"> Health Workers</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Get instant access to ASHA workers and community health professionals.
            Chat, schedule appointments, and receive healthcare guidance from certified experts.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                href="/auth/signup"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link
                href="/auth/signin"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Test Connection Button */}
          <div className="mt-4 text-center">
            <Link
              href="/test-connection"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              🔧 Test Connections
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Chat Feature */}
            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div>
                    <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                      <div className="text-2xl text-white">💬</div>
                    </span>
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                    Direct Messaging
                  </h3>
                  <p className="mt-5 text-base text-gray-500">
                    Chat directly with ASHA workers and health professionals. Get instant responses and guidance for your health concerns.
                  </p>
                </div>
              </div>
            </div>

            {/* Appointment Feature */}
            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div>
                    <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                      <div className="text-2xl text-white">📅</div>
                    </span>
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                    Easy Scheduling
                  </h3>
                  <p className="mt-5 text-base text-gray-500">
                    Book appointments with health workers at your convenience. Get reminders and follow-up notifications.
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Feature */}
            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div>
                    <span className="inline-flex items-center justify-center p-3 bg-red-500 rounded-md shadow-lg">
                      <div className="text-2xl text-white">🚨</div>
                    </span>
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                    Emergency Support
                  </h3>
                  <p className="mt-5 text-base text-gray-500">
                    Get immediate help during emergencies. Priority access to health workers for urgent medical situations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Types */}
        <div className="mt-20">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Who Can Use Aarogya Sahayak?
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* For Patients */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <div className="text-4xl mb-4">🙋‍♀️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">For Patients</h3>
                <ul className="text-left space-y-2 text-gray-600">
                  <li>• Connect with certified ASHA workers</li>
                  <li>• Get health advice and medication guidance</li>
                  <li>• Schedule regular checkups and consultations</li>
                  <li>• Emergency support when needed</li>
                  <li>• Track your health journey</li>
                </ul>
                <Link
                  href="/auth/signup"
                  className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                >
                  Join as Patient
                </Link>
              </div>
            </div>

            {/* For Health Workers */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <div className="text-4xl mb-4">👩‍⚕️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">For Health Workers</h3>
                <ul className="text-left space-y-2 text-gray-600">
                  <li>• Manage your patient consultations</li>
                  <li>• Efficient appointment scheduling</li>
                  <li>• Secure communication platform</li>
                  <li>• Track patient progress</li>
                  <li>• Expand your reach in the community</li>
                </ul>
                <Link
                  href="/auth/signup"
                  className="mt-6 inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium"
                >
                  Join as Health Worker
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Aarogya Sahayak</h3>
            <p className="mt-2 text-gray-600">
              Connecting communities with quality healthcare
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}