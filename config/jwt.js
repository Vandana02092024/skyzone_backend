import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import { jwtDecode } from "jwt-decode";
dotenv.config();

const secretKey = process.env.JWT_SECRET; // Ensure you have a strong secret key in your .env file

export const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, secretKey, { expiresIn });
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