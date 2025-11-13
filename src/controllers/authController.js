// src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Email transporter - only create if email is configured
let transporter = null;

if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

class AuthController {
  /**
   * Register new user
   */
  static async register(req, res) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validate input
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Create user
      const user = new User({
        email,
        password,
        firstName,
        lastName
      });

      // Generate email verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email if transporter is configured
      if (transporter) {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Email - Custodial Wallet',
            html: `
              <h1>Welcome to Custodial Wallet!</h1>
              <p>Hi ${firstName},</p>
              <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
              <a href="${verificationUrl}">${verificationUrl}</a>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create this account, please ignore this email.</p>
            `
          });
        } catch (emailError) {
          console.error('Email sending error:', emailError);
          // Continue anyway - user can resend verification
        }
      } else {
        // For development without email configured
        console.log('📧 Email Verification Link (copy this):');
        console.log(`   ${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`);
      }

      res.status(201).json({
        message: transporter 
          ? 'Registration successful. Please check your email to verify your account.'
          : 'Registration successful. Check console for verification link (email not configured).',
        userId: user._id
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed', details: error.message });
    }
  }

  /**
   * Verify email
   */
  static async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  }

  /**
   * Login
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        return res.status(403).json({ 
          error: 'Please verify your email before logging in',
          emailVerificationRequired: true
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is disabled' });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT
      const token = jwt.sign(
        { 
          userId: user._id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerification(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ error: 'Email already verified' });
      }

      // Generate new token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Send email if configured
      if (transporter) {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Email - Custodial Wallet',
            html: `
              <h1>Email Verification</h1>
              <p>Please verify your email address by clicking the link below:</p>
              <a href="${verificationUrl}">${verificationUrl}</a>
              <p>This link will expire in 24 hours.</p>
            `
          });
        } catch (emailError) {
          console.error('Email sending error:', emailError);
        }
      } else {
        console.log('📧 Verification Link:');
        console.log(`   ${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`);
      }

      res.json({ 
        message: transporter 
          ? 'Verification email sent' 
          : 'Verification link generated (check console)' 
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if email exists
        return res.json({ message: 'If the email exists, a reset link will be sent' });
      }

      const resetToken = user.generatePasswordResetToken();
      await user.save();

      if (transporter) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset - Custodial Wallet',
            html: `
              <h1>Password Reset</h1>
              <p>You requested a password reset. Click the link below to reset your password:</p>
              <a href="${resetUrl}">${resetUrl}</a>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
            `
          });
        } catch (emailError) {
          console.error('Email sending error:', emailError);
        }
      } else {
        console.log('📧 Password Reset Link:');
        console.log(`   ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`);
      }

      res.json({ message: 'If the email exists, a reset link will be sent' });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Password reset failed' });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.userId).select('-password -privateKey');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const stats = await user.getStats();

      res.json({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt
        },
        stats
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }
}

module.exports = AuthController;
}