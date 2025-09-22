import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        if (mongoose.connections[0].readyState) {
            return;
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
            family: 4, // Use IPv4, skip trying IPv6
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection error:', error.message);
        // Don't exit process in development, just log the error
        if (process.env.NODE_ENV !== 'development') {
            process.exit(1);
        }
    }
};

export default connectDB;