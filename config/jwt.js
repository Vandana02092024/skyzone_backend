import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import { jwtDecode } from "jwt-decode";
import crypto from 'crypto';
dotenv.config();

const secretKey = process.env.JWT_SECRET; // Ensure you have a strong secret key in your .env file

export const generateToken = (payload, expiresIn = '30d') => {
  return jwt.sign(payload, secretKey, { expiresIn });
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex'); // Generates a 64-character hex string
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const decodeToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};