import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { databaseService } from './database.js';
import {
  User,
  RegisterUserData,
  LoginUserData,
  AuthTokens,
  JWTPayload
} from '../types/database.js';

export class AuthService {
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  private saltRounds: number;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
    this.saltRounds = 12;
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  // Verify password
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT tokens
  generateTokens(user: User): AuthTokens {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, this.jwtRefreshSecret, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  // Verify access token
  verifyAccessToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  // Verify refresh token
  verifyRefreshToken(token: string): { userId: string } | null {
    try {
      return jwt.verify(token, this.jwtRefreshSecret) as { userId: string };
    } catch (error) {
      return null;
    }
  }

  // Register new user
  async register(userData: RegisterUserData): Promise<User> {
    const { email, password, first_name, last_name, role = 'user' } = userData;

    // Check if user already exists
    const existingUser = await databaseService.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await databaseService.createUser({
      email,
      password_hash: passwordHash,
      first_name,
      last_name,
      role
    });

    return user;
  }

  // Login user
  async login(credentials: LoginUserData): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password } = credentials;

    // Find user
    const user = await databaseService.getUserByEmail(email);
    if (!user || !user.is_active) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await databaseService.updateUserLastLogin(user.id);

    // Generate tokens
    const tokens = this.generateTokens(user);

    return { user, tokens };
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new Error('Invalid refresh token');
    }

    const user = await databaseService.getUserById(payload.userId);
    if (!user || !user.is_active) {
      throw new Error('User not found or inactive');
    }

    const tokens = this.generateTokens(user);
    return { accessToken: tokens.accessToken };
  }

  // Get user by ID (without password hash)
  async getUserProfile(userId: string): Promise<Omit<User, 'password_hash'> | null> {
    const user = await databaseService.getUserById(userId);
    if (!user) return null;

    const { password_hash, ...userProfile } = user;
    return userProfile;
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await databaseService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await this.verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await databaseService.updateUserPassword(userId, newPasswordHash);
  }
}

// Export singleton instance
export const authService = new AuthService();