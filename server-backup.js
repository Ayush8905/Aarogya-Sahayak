// Simple Express server for basic functionality
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
                        Get instant access to ASHA workers and community health professionals in your area.
                    </p>
                    <div class="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                        <div class="rounded-md shadow">
                            <a href="/dashboard" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                                Get Started
                            </a>
                        </div>
                        <div class="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                            <a href="/about" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                                Learn More
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Features -->
                <div class="py-12">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <!-- Features Header -->
                        <div class="lg:text-center mb-12">
                            <h2 class="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
                            <p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                                Everything you need to stay healthy
                            </p>
                        </div>

                        <div class="mt-10">
                            <div class="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
                                <div class="relative">
                                    <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                                        💬
                                    </div>
                                    <p class="ml-16 text-lg leading-6 font-medium text-gray-900">Real-time Chat</p>
                                    <p class="mt-2 ml-16 text-base text-gray-500">
                                        Connect instantly with health workers through our secure messaging system.
                                    </p>
                                </div>

                                <!-- Appointment Feature -->
                                <div class="relative">
                                    <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                                        📅
                                    </div>
                                    <p class="ml-16 text-lg leading-6 font-medium text-gray-900">Easy Appointments</p>
                                    <p class="mt-2 ml-16 text-base text-gray-500">
                                        Schedule appointments with healthcare professionals at your convenience.
                                    </p>
                                </div>

                                <!-- Emergency Feature -->
                                <div class="relative">
                                    <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-red-500 text-white">
                                        🚨
                                    </div>
                                    <p class="ml-16 text-lg leading-6 font-medium text-gray-900">Emergency Support</p>
                                    <p class="mt-2 ml-16 text-base text-gray-500">
                                        24/7 emergency assistance when you need it most.
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
                        <p class="text-base text-gray-500">
                            &copy; 2024 Aarogya Sahayak. Connecting communities with healthcare.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    </body>
    </html>
    `);
});

// Basic health worker routes
app.get('/api/workers', (req, res) => {
    // Mock data for demonstration
    res.json([
        { id: 1, name: 'Priya Sharma', specialization: 'Community Health', location: 'Delhi', available: true },
        { id: 2, name: 'Raj Kumar', specialization: 'Maternal Health', location: 'Mumbai', available: false },
        { id: 3, name: 'Sunita Devi', specialization: 'Child Health', location: 'Bangalore', available: true }
    ]);
});

app.listen(port, () => {
    console.log(`🏥 Aarogya Sahayak server running at http://localhost:${port}`);
    console.log(`📱 Ready to connect patients with health workers!`);
    console.log(`🔗 Visit the dashboard at http://localhost:${port}/dashboard`);
});