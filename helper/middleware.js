import { verifyToken } from '../config/jwt.js';
import { ApiLog } from "../config/tables.js";
import CommonFunction from "../helper/common.js";
import dotenv from "dotenv";
dotenv.config();

export const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.headers["x-authorization"]; // API key is in 'x-api-key' header
    const url = req.originalUrl;
    if (url.includes('/crons')) {
      return next(); // Skip API key validation for /crons route
    }

    if (url.includes('/roller-webhooks')) {
      return next(); // Skip API key validation for /crons route
    }
  
    if (!apiKey) {
      return res.status(401).json({ error: "Unauthorized - Key missing" });
    }
  
    // API key validation logic
    if (apiKey === process.env.VALIDATION_KEY) {
      // Valid API key
      next();
    } else {
      // Invalid API key
      return res.status(401).json({ error: "Unauthorized - Invalid key" });
    }
};

export const authToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader){
      return res.status(401).json({ error: 'Unauthorized - Token missing' });
    }
    // const token = authHeader && authHeader.split(' ')[0];
    const token = authHeader.replace("Bearer ", "");
  
    if (!token) return res.status(401).json({ error: 'Access token required' });
  
    try {
      const user = verifyToken(token);
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
};

export const apiLogger = async (req, res, next) => {
  try {
    // Extract user request details
    const body = req.body || '';
    const params = req.params || '';
    const query = req.query || '';
    const user_request = {
      body,
      params,
      query
    };
    const username = req.body.username ? req.body.username : '';
    const customer_id = CommonFunction.getCustomerId(req, res);
    // Extract necessary data
    const user_id = customer_id ? customer_id : null; // Assuming customerId is sent in the request body
    const apiName = req.originalUrl; // URL endpoint of the API
    const createdAt = new Date(); // Current timestamp

    // Insert log entry into the database
    await ApiLog.create({
      user_id,
      apiName,
      createdAt,
      comment:username,
      user_request: user_request
    });

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error logging API request:', error);
    next(error); // Pass error to the next handler
  }
};