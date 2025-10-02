import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const testConnection = async () => {
    try {
        console.log('🧪 Testing MongoDB connection...');

        const mongoUri = process.env.MONGODB_URI;
        console.log('🔍 MongoDB URI found:', !!mongoUri);

        if (!mongoUri) {
            console.error('❌ MONGODB_URI not found in environment variables');
            process.exit(1);
        }

        console.log('🚀 Connecting to MongoDB...');

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
            socketTimeoutMS: 15000,
            family: 4,
            maxPoolSize: 10,
            retryWrites: true,
            w: 'majority'
        });

        console.log('✅ MongoDB connection successful!');
        console.log(`📍 Connected to: ${mongoose.connection.host}`);
        console.log(`🗄️  Database: ${mongoose.connection.name}`);

        // Test basic operations
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📂 Collections found: ${collections.length}`);
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });

        await mongoose.connection.close();
        console.log('✅ Connection test completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        process.exit(1);
    }
};

testConnection();