const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/user');
const verifyToken = require('../middleware/verify');

const router = express.Router();

// Helper function for sending password reset email
async function sendPasswordResetEmail(user, resetToken) {
  // For testing, use Ethereal (https://ethereal.email/)
  // For production, use SendGrid, Mailgun, or AWS SES
  
  let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.ETHEREAL_USER, // Add to your .env file
      pass: process.env.ETHEREAL_PASS  // Add to your .env file
    }
  });

  const resetURL = `http://localhost:5000/reset-password.html?token=${resetToken}`;

  const mailOptions = {
    from: 'TechVision Solutions <noreply@techvision.com>',
    to: user.email,
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hello ${user.name},</p>
      <p>You requested a password reset. Click the link below to reset your password. This link is valid for 10 minutes.</p>
      <a href="${resetURL}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
    `
  };

  let info = await transporter.sendMail(mailOptions);
  console.log('Message sent: %s', info.messageId);
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
}

// SIGNUP route
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FORGOT PASSWORD route
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      // Send success message even if user not found (security best practice)
      return res.json({ 
        message: 'If an account with that email exists, a reset link has been sent.' 
      });
    }

    // Generate random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token and save it to user model
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expiration time (10 minutes)
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send email with UN-HASHED token
    try {
      await sendPasswordResetEmail(user, resetToken);
      res.json({ 
        message: 'If an account with that email exists, a reset link has been sent.' 
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      return res.status(500).json({ 
        message: 'Error sending password reset email.' 
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// RESET PASSWORD route
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  // Hash the incoming token to match database
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  try {
    // Find user by hashed token and check expiration
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Password reset token is invalid or has expired.' 
      });
    }

    // Update password
    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PROTECTED route (example)
router.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'This is protected data', user: req.user });
});

module.exports = router;
