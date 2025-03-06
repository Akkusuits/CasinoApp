import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertGameHistorySchema } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import crypto from "crypto";
import nodemailer from "nodemailer";

const SessionStore = MemoryStore(session);

// Setup nodemailer with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(session({
    secret: 'casino-secret',
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { secure: false }
  }));

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      console.log('Registration attempt:', { ...req.body, password: '[REDACTED]' });
      const userData = insertUserSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        console.log('Registration failed: Username already taken');
        return res.status(400).json({ message: "Username already taken" });
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create user with verification token
      const user = await storage.createUser({
        ...userData,
        verificationToken,
        emailVerified: false
      });

      console.log('User created successfully:', { id: user.id, username: user.username });

      // Send verification email
      // Get the app URL from environment or use the Replit URL
      const appUrl = process.env.APP_URL || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
      const verificationLink = `${appUrl}/api/auth/verify/${verificationToken}`;
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: userData.email,
          subject: 'Verify your email address',
          html: `
            <h1>Welcome to Casino App!</h1>
            <p>Click the link below to verify your email address:</p>
            <a href="${verificationLink}">${verificationLink}</a>
          `
        });
        console.log('Verification email sent successfully');
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Still create the user but inform about email issue
        return res.status(201).json({ 
          message: "Registration successful but verification email could not be sent. Please contact support." 
        });
      }

      res.status(201).json({ 
        message: "Registration successful. Please check your email to verify your account." 
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.get('/api/auth/verify/:token', async (req, res) => {
    try {
      console.log('Verifying email with token:', req.params.token);
      const { token } = req.params;
      const user = await storage.verifyEmail(token);
      if (!user) {
        console.error('Invalid verification token');
        return res.status(400).send(`
          <html>
            <head><title>Verification Failed</title></head>
            <body>
              <h1>Verification Failed</h1>
              <p>Invalid or expired verification token.</p>
              <a href="/auth">Return to login page</a>
            </body>
          </html>
        `);
      }
      console.log('Email verified successfully for user:', user.username);
      // After successful verification, redirect to login page with success message
      res.redirect('/auth?verified=true');
    } catch (error) {
      console.error('Verification error:', error);
      res.status(400).send(`
        <html>
          <head><title>Verification Failed</title></head>
          <body>
            <h1>Verification Failed</h1>
            <p>An error occurred during verification. Please try again or contact support.</p>
            <a href="/auth">Return to login page</a>
          </body>
        </html>
      `);
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      // Try to find user by username first, then by email
      let user = await storage.getUserByUsername(credentials.login);
      if (!user) {
        user = await storage.getUserByEmail(credentials.login);
      }

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      if (user.password !== credentials.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (!user.emailVerified) {
        return res.status(401).json({ message: "Please verify your email first" });
      }
      
      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username, balance: user.balance });
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Forgot password endpoint
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security reasons
        return res.status(200).json({ message: "If your email is registered, you will receive a password reset link" });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Update user with reset token
      await storage.updateUserResetToken(user.id, resetToken, resetTokenExpiry);

      // Generate reset link
      const appUrl = process.env.APP_URL || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
      const resetLink = `${appUrl}/auth/reset-password/${resetToken}`;

      // Send reset email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset your password',
        html: `
          <h1>Reset Your Password</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>This link will expire in 1 hour.</p>
        `
      });

      res.status(200).json({ message: "Password reset link sent to your email" });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: "Failed to send reset link" });
    }
  });

  // Resend verification email endpoint
  app.post('/api/auth/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security reasons
        return res.status(200).json({ message: "If your email is registered, you will receive a verification link" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Update user with new verification token
      await storage.updateUserVerificationToken(user.id, verificationToken);

      // Generate verification link
      const appUrl = process.env.APP_URL || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
      const verificationLink = `${appUrl}/api/auth/verify/${verificationToken}`;

      // Send verification email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your email address',
        html: `
          <h1>Welcome to Casino App!</h1>
          <p>Click the link below to verify your email address:</p>
          <a href="${verificationLink}">${verificationLink}</a>
        `
      });

      res.status(200).json({ message: "Verification email has been resent" });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  // Reset password endpoint
  app.post('/api/auth/reset-password/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }
      
      // Find user by reset token
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Check if token is expired
      if (user.resetTokenExpiry && new Date(user.resetTokenExpiry) < new Date()) {
        return res.status(400).json({ message: "Reset token has expired" });
      }
      
      // Update password and clear reset token
      await storage.updateUserPassword(user.id, password);
      
      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Game routes
  app.post('/api/game/result', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const gameResult = insertGameHistorySchema.parse(req.body);
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const newBalance = user.balance + (gameResult.payout - gameResult.betAmount);
      const updatedUser = await storage.updateUserBalance(user.id, newBalance);
      const history = await storage.addGameHistory(gameResult);

      res.json({ 
        balance: updatedUser.balance,
        history
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get('/api/game/history', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const history = await storage.getUserHistory(req.session.userId);
    res.json(history);
  });

  app.get('/api/user/me', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({ 
      id: user.id, 
      username: user.username, 
      balance: user.balance 
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}