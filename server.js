const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Aarogya Sahayak - Health Worker Connect</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <!-- Header -->
            <header class="bg-white shadow-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center py-6">
                        <div class="flex items-center">
                            <h1 class="text-2xl font-bold text-indigo-600">
                                🏥 Aarogya Sahayak
                            </h1>
                        </div>
                        <div class="flex space-x-4">
                            <a href="/auth/signin" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                                Sign In
                            </a>
                            <a href="/auth/signup" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                                Sign Up
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Hero Section -->
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div class="text-center">
                    <h1 class="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                        Connect with
                        <span class="text-indigo-600"> Health Workers</span>
                    </h1>
                    <p class="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                        Get instant access to ASHA workers and community health professionals. 
                        Chat, schedule appointments, and receive healthcare guidance from certified experts.
                    </p>
                    <div class="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                        <div class="rounded-md shadow">
                            <a href="/auth/signup" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                                Get Started
                            </a>
                        </div>
                        <div class="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                            <a href="/auth/signin" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                                Sign In
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Features -->
                <div class="mt-20">
                    <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        <!-- Chat Feature -->
                        <div class="pt-6">
                            <div class="flow-root bg-white rounded-lg px-6 pb-8">
                                <div class="-mt-6">
                                    <div>
                                        <span class="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                                            <div class="text-2xl text-white">💬</div>
                                        </span>
                                    </div>
                                    <h3 class="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                                        Direct Messaging
                                    </h3>
                                    <p class="mt-5 text-base text-gray-500">
                                        Chat directly with ASHA workers and health professionals. Get instant responses and guidance for your health concerns.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Appointment Feature -->
                        <div class="pt-6">
                            <div class="flow-root bg-white rounded-lg px-6 pb-8">
                                <div class="-mt-6">
                                    <div>
                                        <span class="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                                            <div class="text-2xl text-white">📅</div>
                                        </span>
                                    </div>
                                    <h3 class="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                                        Easy Scheduling
                                    </h3>
                                    <p class="mt-5 text-base text-gray-500">
                                        Book appointments with health workers at your convenience. Get reminders and follow-up notifications.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Emergency Feature -->
                        <div class="pt-6">
                            <div class="flow-root bg-white rounded-lg px-6 pb-8">
                                <div class="-mt-6">
                                    <div>
                                        <span class="inline-flex items-center justify-center p-3 bg-red-500 rounded-md shadow-lg">
                                            <div class="text-2xl text-white">🚨</div>
                                        </span>
                                    </div>
                                    <h3 class="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                                        Emergency Support
                                    </h3>
                                    <p class="mt-5 text-base text-gray-500">
                                        Get immediate help during emergencies. Priority access to health workers for urgent medical situations.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <!-- Footer -->
            <footer class="bg-white">
                <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div class="text-center">
                        <h3 class="text-lg font-medium text-gray-900">Aarogya Sahayak</h3>
                        <p class="mt-2 text-gray-600">
                            Connecting communities with quality healthcare
                        </p>
                        <p class="mt-2 text-sm text-gray-500">
                            Server is running successfully! 🎉
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    </body>
    </html>
  `);
});

// API Routes
app.get('/api/test', (req, res) => {
    res.json({
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        status: 'success'
    });
});

app.listen(port, () => {
    console.log(`🚀 Aarogya Sahayak server running at http://localhost:${port}`);
    console.log('📱 Health Worker Connect & Communication platform is ready!');
    console.log('✅ MongoDB connection can be added next');
    console.log('✅ Socket.io for real-time chat can be added next');
    console.log('✅ Authentication system can be added next');
});