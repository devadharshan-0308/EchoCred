import express from 'express';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const testLoginDirect = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    const email = 'jane.learner@example.com';
    const password = 'password123';

    // Simulate the exact login logic from authRoutes.js
    console.log('Testing login for:', email);

    // Find user and include password for comparison
    const user = await User.findByCredentials(email, password);
    console.log('User found via findByCredentials:', user ? 'YES' : 'NO');

    if (user) {
      // Generate token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      });

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      console.log('✅ Login successful!');
      console.log('User ID:', user._id);
      console.log('Token generated:', token ? 'YES' : 'NO');
      console.log('User data:', {
        email: userResponse.email,
        firstName: userResponse.firstName,
        lastName: userResponse.lastName,
        role: userResponse.role
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    process.exit(1);
  }
};

testLoginDirect();
