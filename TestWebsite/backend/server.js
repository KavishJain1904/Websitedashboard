// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const contentRoutes = require('./routes/content');
const User = require('./models/user');

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '.', 'public')));

// API routes
app.use('/api', authRoutes);
app.use('/api', contactRoutes);
app.use('/api', contentRoutes);

// MongoDB connection + ADMIN seeding
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✓ MongoDB connected');

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn('⚠ ADMIN_EMAIL or ADMIN_PASSWORD not set in .env – skipping admin seeding.');
    } else {
      try {
        let adminUser = await User.findOne({ email: adminEmail });

        if (!adminUser) {
          // create new admin user
          const hashed = await bcrypt.hash(adminPassword, 10);
          adminUser = await User.create({
            name: 'Admin',
            email: adminEmail,
            password: hashed,
            isAdmin: true
          });
          console.log(`✓ Admin user created from .env: ${adminEmail}`);
        } else {
          // ensure isAdmin flag is true
          if (!adminUser.isAdmin) {
            adminUser.isAdmin = true;
            await adminUser.save();
            console.log(`✓ Existing user promoted to admin: ${adminEmail}`);
          } else {
            console.log(`✓ Admin user already exists: ${adminEmail}`);
          }
        }
      } catch (err) {
        console.error('Admin seeding error:', err.message);
      }
    }
  })
  .catch(err => console.error('MongoDB error:', err.message));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log('✓ Content routes loaded - you can now edit website content!');
});
