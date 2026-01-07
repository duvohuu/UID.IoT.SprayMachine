import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * ========================================
 * CREATE USER SCRIPT
 * ========================================
 * Modify USER_DATA object below to create different users
 */

// CẤU HÌNH USER TẠI ĐÂY
const USER_DATA = {
    userId: 'ADMIN002',
    username: 'An',                     
    email: 'huynhduyan0802@gmail.com',      
    password: 'huynhduyan0802',               
    role: 'admin'                     
};

const createUser = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        console.log('📍 URI:', process.env.MONGO_URI?.replace(/\/\/.*:.*@/, '//<credentials>@'));
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Validation
        if (!USER_DATA.username || !USER_DATA.email || !USER_DATA.password) {
            console.error('❌ Error: username, email, và password là bắt buộc!');
            console.log('   Sửa USER_DATA object trong scripts/createUser.js');
            process.exit(1);
        }

        // Check if user exists by email
        const existingUserByEmail = await User.findOne({ email: USER_DATA.email });
        if (existingUserByEmail) {
            console.log('⚠️  User với email này đã tồn tại!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 Email:', existingUserByEmail.email);
            console.log('👤 Username:', existingUserByEmail.username);
            console.log('🆔 UserID:', existingUserByEmail.userId);
            console.log('🎭 Role:', existingUserByEmail.role);
            console.log('✅ Active:', existingUserByEmail.isActive);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            await mongoose.disconnect();
            process.exit(0);
        }

        // Check if username exists
        const existingUserByUsername = await User.findOne({ username: USER_DATA.username });
        if (existingUserByUsername) {
            console.log('⚠️  Username này đã tồn tại!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('👤 Username:', existingUserByUsername.username);
            console.log('📧 Email:', existingUserByUsername.email);
            console.log('🆔 UserID:', existingUserByUsername.userId);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('\n💡 Hãy đổi username trong USER_DATA và thử lại');
            await mongoose.disconnect();
            process.exit(0);
        }

        // Create new user
        const newUser = new User({
            userId: USER_DATA.userId,
            username: USER_DATA.username,
            email: USER_DATA.email,
            password: USER_DATA.password,  
            role: USER_DATA.role || 'user',
            isActive: true
        });

        await newUser.save();

        console.log('✅ User created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🆔 UserID:', newUser.userId);
        console.log('👤 Username:', newUser.username);
        console.log('📧 Email:', newUser.email);
        console.log('🔑 Password:', USER_DATA.password);  
        console.log('🎭 Role:', newUser.role);
        console.log('✅ Active:', newUser.isActive);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📌 Important Notes:');
        console.log('   - UserID này được dùng để gán quyền sở hữu máy');
        console.log('   - Khi tạo máy mới, set machine.userId = ' + newUser.userId);
        console.log('   - User này có thể login với:');
        console.log(`     Email: ${newUser.email}`);
        console.log(`     Password: ${USER_DATA.password}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating user:', error.message);
        
        if (error.name === 'ValidationError') {
            console.log('\n📋 Validation Errors:');
            Object.keys(error.errors).forEach(key => {
                console.log(`   - ${key}: ${error.errors[key].message}`);
            });
        }
        
        await mongoose.disconnect();
        process.exit(1);
    }
};

createUser();