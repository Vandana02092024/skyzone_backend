const router = express.Router();
import express from "express";
import {authToken } from '../../../helper/middleware.js';
import { 
    getLocations,
    getCompanies,
    getEmployees,
    getShifts,
    InsertHeadCountData,
    CreateGroupArrivalData,
} from "../controllers/HumanityController.js";

router.get('/get-locations', getLocations);
router.get('/get-companies', getCompanies);
router.get('/get-employees', getEmployees);
router.get('/get-shifts', getShifts);
router.get('/create-headcount-data', InsertHeadCountData);
router.get('/create-grouparrival-data', CreateGroupArrivalData);

export default router;