const router = express.Router();
import express from "express";
import { authToken } from "../../../helper/middleware.js";
import {
  createChildren,
  updateChildren,
  deleteChild,
  removeUserProfile,
  searchCustomer,
  uploadProfilePicture,
  removeProfilePicture,
  removeCustomerDevice,
  updateCustomerProfile,
} from "../controllers/CustomerController.js";

import {
  getDeviceIds
} from "../controllers/FirebaseController.js";

router.post("/create_children", createChildren);
router.put("/update_children", updateChildren);
router.delete("/delete_child", deleteChild);
router.delete("/remove-user-profile", authToken, removeUserProfile);
router.get("/search_customer", authToken, searchCustomer);
router.post("/profile-picture", authToken, uploadProfilePicture);
router.delete("/delete-profile-picture", authToken, removeProfilePicture);
router.delete("/remove_device", authToken, removeCustomerDevice);
router.put("/update_profile", authToken, updateCustomerProfile);
router.get('/get-device-ids', getDeviceIds);

export default router;
