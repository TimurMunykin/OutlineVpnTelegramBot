import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';

interface RegisterRequest extends Request {
  body: {
    email: string;
    name: string;
    password: string;
  };
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

interface RefreshRequest extends Request {
  body: {
    refreshToken: string;
  };
}


export class AuthController {
  static async register(req: RegisterRequest, res: Response): Promise<Response> {
    try {
      const { email, name, password } = req.body;

      if (!email || !name || !password) {
        return res.status(400).json({ 
          error: 'Email, name and password are required' 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          error: 'Password must be at least 6 characters long' 
        });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          error: 'User with this email already exists' 
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await UserModel.create({
        email,
        name,
        password: hashedPassword,
        role: 'USER',
        isEmailVerified: false,
      });

      const { passwordHash: _, ...userWithoutPassword } = user;

      return res.status(201).json({
        message: 'User registered successfully',
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async login(req: LoginRequest, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }

      const user = await UserModel.findByEmailWithPassword(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if user has web access
      if (!user.hasWebAccess) {
        return res.status(403).json({ 
          error: 'Web access is not enabled for this account' 
        });
      }

      const accessToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || '',
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as jwt.SignOptions
      );

      const refreshToken = jwt.sign(
        { 
          id: user.id 
        },
        process.env.JWT_REFRESH_SECRET || '',
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
      );

      await UserModel.saveRefreshToken(user.id, refreshToken);

      const { passwordHash: _, ...userWithoutPassword } = user;

      return res.json({
        message: 'Login successful',
        user: userWithoutPassword,
        token: accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async refresh(req: RefreshRequest, res: Response): Promise<Response> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || '') as { id: number };
      
      const isTokenValid = await UserModel.verifyRefreshToken(decoded.id, refreshToken);
      if (!isTokenValid) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const user = await UserModel.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Check if user still has web access
      if (!user.hasWebAccess) {
        return res.status(403).json({ 
          error: 'Web access is not enabled for this account' 
        });
      }

      const newAccessToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || '',
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as jwt.SignOptions
      );

      return res.json({
        token: newAccessToken,
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
  }

  static async logout(req: Request, res: Response): Promise<Response> {
    try {
      if (req.user) {
        await UserModel.revokeRefreshTokens(req.user.id);
      }

      return res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async me(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { passwordHash: _, ...userWithoutPassword } = user;

      return res.json({
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}