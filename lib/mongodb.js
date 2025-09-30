import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        if (mongoose.connections[0].readyState) {
            return mongoose.connections[0];
        }

        // Check if MONGODB_URI exists
        if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('your-username')) {
            console.log('MongoDB URI not found or contains placeholder values, using mock data mode');
            return null;
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 5000,
            family: 4, // Use IPv4, skip trying IPv6
            maxPoolSize: 10,
            retryWrites: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('Database connection error:', error.message);
        // Return null instead of crashing
        return null;
    }
};

export default connectDB;