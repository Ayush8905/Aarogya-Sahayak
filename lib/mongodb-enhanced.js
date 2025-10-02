import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const connectDB = async () => {
    try {
        // If already connected, return existing connection
        if (mongoose.connections[0].readyState === 1) {
            console.log('✅ Using existing MongoDB connection');
            return mongoose.connections[0];
        }

        // Check if MONGODB_URI exists and is valid
        const mongoUri = process.env.MONGODB_URI;
        console.log('🔍 Checking MongoDB URI...');
        console.log('MongoDB URI exists:', !!mongoUri);

        if (!mongoUri) {
            console.log('❌ MONGODB_URI not found in environment variables');
            console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('MONGO')));
            return null;
        }

        if (mongoUri.includes('your-username') || mongoUri.includes('your-password')) {
            console.log('❌ MongoDB URI contains placeholder values');
            return null;
        }

        console.log('🚀 Attempting to connect to MongoDB...');

        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 15000, // Increased timeout
            connectTimeoutMS: 15000,
            socketTimeoutMS: 15000,
            family: 4, // Use IPv4, skip trying IPv6
            maxPoolSize: 10,
            retryWrites: true,
            w: 'majority'
        });

        console.log('✅ MongoDB Connected successfully!');
        console.log(`📍 Connected to: ${conn.connection.host}`);
        console.log(`🗄️  Database: ${conn.connection.name}`);

        // Set up connection event listeners
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('🔌 MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
        });

        return conn;

    } catch (error) {
        console.error('❌ Database connection error:');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);

        // Log specific connection errors
        if (error.message.includes('ENOTFOUND')) {
            console.error('🌐 Network error: Cannot resolve MongoDB host');
        } else if (error.message.includes('authentication failed')) {
            console.error('🔐 Authentication error: Invalid credentials');
        } else if (error.message.includes('timeout')) {
            console.error('⏰ Connection timeout: MongoDB server unreachable');
        }

        // Return null instead of crashing the app
        return null;
    }
};

export default connectDB;