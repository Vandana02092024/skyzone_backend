const router = express.Router();
import express from "express";
import {authToken } from '../../../helper/middleware.js';
import { 
    searchMenuItems,
    getCategoryItems,
    getOffersBanner,
    getPopularItems,
    login,
    OrdersStatusUpdate,
    filterOrders,
    getProfileDetails,
    filterOrdersByCustomer,
    CustomerReminder,
} from "../controllers/RestaurantController.js";

import { 
    PaymentForRestaurentOrders,
    PaymentForBookingTemClose,
} from "../controllers/PaymentController.js";

import { 
    createBookingForRestaurant,
} from "../controllers/BookingController.js";

router.get('/menu/item_categories', searchMenuItems);
router.get('/menu/category_items', getCategoryItems);
router.get('/menu/offer_banners',getOffersBanner);
router.get('/menu/items' , getPopularItems);
router.get('/orders/filter_orders', authToken , filterOrdersByCustomer);
router.post('/orders/payment', authToken , PaymentForRestaurentOrders);
router.post('/orders/create', authToken , createBookingForRestaurant);

// kitchen app routes
router.post('/kitchen/auth/login' , login);
router.post('/kitchen/orders/status_updates' , authToken , OrdersStatusUpdate);
router.get('/kitchen/orders/filter_orders' , filterOrders);
router.get('/kitchen/profile/fetch' , authToken, getProfileDetails);
router.post('/kitchen/reminders' , authToken, CustomerReminder);

export default router;