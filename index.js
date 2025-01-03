import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from "cors";
import { generateToken } from './config/jwt.js';
import {apiKeyMiddleware, authToken, apiLogger } from './helper/middleware.js';
import userRoute from "./app/v1/routes/userRoutes.js";
import authRoute from "./app/v1/routes/authRoutes.js";
import homeRoute from "./app/v1/routes/homeRoutes.js";
import productsRoute from "./app/v1/routes/productsRoutes.js";
import customerRoute from "./app/v1/routes/customerRoutes.js";
import rewardsRoutes from "./app/v1/routes/rewardsRoutes.js";
import bookingRoutes from "./app/v1/routes/bookingRoutes.js";
import restaurantRoutes from "./app/v1/routes/restaurantRoutes.js";
import firebaseRoutes from "./app/v1/routes/firebaseRoutes.js";
import helpCenterRoutes from "./app/v1/routes/helpCenterRoutes.js";
import infoRoutes from "./app/v1/routes/infoRoutes.js";
import cronsRoutes from "./app/v1/routes/cronsRoutes.js";
import webHookRoutes from "./app/v1/routes/webHookRoutes.js";
import logsRoutes from "./app/v1/routes/logsRoutes.js";
import humanityRoutes from "./app/v1/routes/humanityRoutes.js";

// WEB ROUTES
import webAuthRoutes from "./app/v1/web/routes/authRoute.js";
import webUserRoutes from "./app/v1/web/routes/userRoute.js";
import webHomeRoutes from "./app/v1/web/routes/home.js";
import webRewardsRoutes from "./app/v1/web/routes/rewardsRoute.js";
import webPaymentRoutes from "./app/v1/web/routes/paymentRoute.js";
import webOffersRoutes from "./app/v1/web/routes/latestOfferRoutes.js";
import webAddonsRoutes from "./app/v1/web/routes/addonsRoute.js";
import webMenuItemsRoutes from "./app/v1/web/routes/menuitemsRoute.js";
import webPushNotifyRoutes from "./app/v1/web/routes/pushnotifyRoute.js";
import predictedTraffic from "./app/v1/web/routes/predictedTrafficRoutes.js";
import webProductAvailRoutes from "./app/v1/web/routes/productAvailabilityRoutes.js";
import managerRoutes from "./app/v1/web/routes/managerRoute.js";

import {
  validate,
  bodyValidation,
  queryValidation,
  paramsValidation
} from "./helper/validatorMiddleware.js";

// INITIALIZE APP //
const app = express();
app.use(helmet());
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());
app.use(cookieParser());

var corsOptions = {
  origin: process.env.WEB_ORIGIN,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use("/", cors(corsOptions), function (req, res, next) {
  const origin = req.headers.origin;
  // const host = req.headers.host;

  // Determine if the request is from the same origin
  const isSameOrigin =
    origin === corsOptions.origin || typeof origin === "undefined";

  // if ((!origin && origin !== undefined) || corsOptions.origin === origin)
  if (isSameOrigin) {
    next();
  } else res.status(403).json({ msg: "Not allowed." });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: err.message }); // Send a 403 Forbidden response
  }
  next(err); // Pass the error to the next middleware if it's not a CORS error
});

app.set("trust proxy", 1);

// Use Helmet for security
app.use(
  helmet({
    frameguard: { action: "deny" }, // Prevent clickjacking
    xssFilter: true, // Prevent XSS attacks
  })
);

app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
});

// Get the current directory path using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env
dotenv.config();
const PORT = process.env.PORT;
const VERSION_URL =  process.env.VERSION_URL;
const REDIRECT_URL =  process.env.REDIRECT_URL;

// ALL ROUTES --start //
const sendResponse = (res, statusCode, message, data) => {
  res
    .status(statusCode)
    .json({ status: "success", message: message, data: data });
};

// Apply the logging middleware globally
app.use(apiLogger);
// Apply the express validator middleware globally
app.use(bodyValidation,queryValidation,paramsValidation,validate);

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('Server', 'SecureServer');
  next();
});

app.use('/img', express.static(path.join(__dirname, '/img')));
app.post("/csp-violation-report-endpoint", (req, res) => {
  console.log("CSP Violation:", req.body);
  res.status(204).send(); // No content response
});
app.get("/", (req, res) => {
  res.redirect(REDIRECT_URL);
});

// Rate limiter middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: false,
    message: "Too many requests from this IP, please try again later.",
  },
  handler: (req, res) => {
    res.status(429).json({
      status: false,
      message: "Too many requests, please try again later.",
    });
  },
});
// Apply rate limiter to all requests
app.use(limiter);

// app.get("/"+VERSION_URL, (req, res) => {
//   res.json({ message: "Welcome to application."+VERSION_URL });
// });
// app.use(VERSION_URL+"/user", apiKeyMiddleware, userRoute);
app.use(VERSION_URL+"/auth",apiKeyMiddleware, authRoute);
app.use(VERSION_URL+"/",apiKeyMiddleware, homeRoute);
app.use(VERSION_URL+"/products",apiKeyMiddleware, productsRoute);
app.use(VERSION_URL+"/customer",apiKeyMiddleware, customerRoute);
app.use(VERSION_URL+"/rewards",apiKeyMiddleware, rewardsRoutes);
app.use(VERSION_URL+"/booking",apiKeyMiddleware, bookingRoutes);
app.use(VERSION_URL+"/restaurant",apiKeyMiddleware, restaurantRoutes);
app.use(VERSION_URL+"/firebase",apiKeyMiddleware, firebaseRoutes);
app.use(VERSION_URL+"/help_center",apiKeyMiddleware, helpCenterRoutes);
app.use(VERSION_URL+"/info",apiKeyMiddleware, infoRoutes);
app.use("/cron/roller", cronsRoutes);
app.use(VERSION_URL+"/roller-webhooks", webHookRoutes);
app.use(VERSION_URL+"/log",apiKeyMiddleware, logsRoutes);
app.use(VERSION_URL+"/humanity", humanityRoutes);


// WEB ROUTES

app.use(VERSION_URL + "/web/sample", apiKeyMiddleware, userRoute);
app.use(VERSION_URL+"/web/auth", apiKeyMiddleware, webAuthRoutes);
app.use(VERSION_URL+"/web/user", authToken, apiKeyMiddleware, webUserRoutes);
app.use(VERSION_URL+"/web", authToken, apiKeyMiddleware, webHomeRoutes);
app.use(VERSION_URL+"/web/rewards", authToken, apiKeyMiddleware, webRewardsRoutes);
app.use(VERSION_URL+"/web/payment", authToken, apiKeyMiddleware, webPaymentRoutes);
app.use(VERSION_URL+"/web/offers", authToken, apiKeyMiddleware, webOffersRoutes);
app.use(VERSION_URL+"/web/addons/", authToken, apiKeyMiddleware, webAddonsRoutes);
app.use(VERSION_URL+"/web/menu-items/", authToken, apiKeyMiddleware, webMenuItemsRoutes);
app.use(VERSION_URL+"/web/product-availability/", authToken, apiKeyMiddleware, webProductAvailRoutes);
app.use(VERSION_URL+"/web/predicted-traffic", authToken, apiKeyMiddleware, predictedTraffic);
app.use(
  VERSION_URL+"/web/push-notifications/",
  authToken,
  apiKeyMiddleware,
  webPushNotifyRoutes
);
app.use(VERSION_URL+"/web/manager", authToken, apiKeyMiddleware, managerRoutes);


// LISTEN TO PORT // 
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
