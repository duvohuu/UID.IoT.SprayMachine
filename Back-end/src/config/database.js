import mongoose from 'mongoose';

/**
 * ========================================
 * DATABASE CONNECTION
 * ========================================
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📂 Database: ${conn.connection.name}`);
        
        return conn;
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

export default connectDB;
