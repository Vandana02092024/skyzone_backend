const router = express.Router();
import express from "express";
import {
  listUser,
  MobileCustomerEncryption,
  CustomerEncryption,
  createData,
  getData,
} from "../controllers/UserController.js";

router.get('/list', listUser);
router.get('/en-mobile-customers', MobileCustomerEncryption);
router.get('/en-customers', CustomerEncryption);
router.post('/create', createData);
router.get('/get-list', getData);

// module.exports = router;
export default router;
