const router = express.Router();
import express from "express";
import {authToken } from '../../../helper/middleware.js';
import { 
    getLocations,
    getCompanies,
    getEmployees,
    getShifts,
} from "../controllers/HumanityController.js";

router.get('/get-locations', getLocations);
router.get('/get-companies', getCompanies);
router.get('/get-employees', getEmployees);
router.get('/get-shifts', getShifts);

export default router;