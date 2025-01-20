const router = express.Router();
import express from "express";
import {
    AvailableProducts,
    InsertCustomers,
    InsertDiscounts,
    getBookingByLocation,
    getProductsByLocation,
    MapCustomerId,
    Memberships,
    PushNotification,
    getRestaurantPopularItems,
    SignedWaivers,
    Tickets,
    UpcomingEvent,
    UpdateUnResolveBooking
} from "../controllers/CronsController.js";

router.get('/AvailableProducts', AvailableProducts);
router.get('/Customers', InsertCustomers);
router.get('/Discounts', InsertDiscounts);
router.get('/GetBookingsByLocation', getBookingByLocation);
router.get('/GetProductsByLocations', getProductsByLocation);
router.get('/MapCustomerId', MapCustomerId);
router.get('/Memberships', Memberships);
router.get('/PushNotification', PushNotification);
router.get('/RestaurantPopularItems', getRestaurantPopularItems);
router.get('/SignedWaivers', SignedWaivers);
router.get('/Tickets', Tickets);
router.get('/UpcomingEvent', UpcomingEvent);
router.get('/ResolveBookings', UpdateUnResolveBooking);

export default router;
