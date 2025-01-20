import CommonFunction from "../../../../helper/common.js";
import productService from "../../models/products.js";
import { updateStatus } from "../models/productavailability.js";

export const getAddonsProducts = async (req, res) => {
  const { client_id, card_id, date } = req.query;

  if (!client_id) {
      return res.status(400).json(CommonFunction.errMessage("Client ID is required"));
  }

  if (!card_id) {
      return res.status(400).json(CommonFunction.errMessage("Card ID is required"));
  }
  try {
      let cardDetails = await productService.getCardDetails(card_id, client_id);
      const result = cardDetails.dataValues;
      const display = 0;

      const productDt = await productService.getAvailableProducts(client_id,display);

      let availabilityDate = date ? date : new Date().toISOString().split("T")[0];
      const final_response = [];

      productDt?.forEach(async (value) => {
          if (value?.type === result?.product_type || (result?.product_type === "memberships" && value?.type === "membership")) {
              let clonedValue = { ...value.dataValues };

              clonedValue.rawdesc = value?.dataValues?.description;
              clonedValue.description = value?.dataValues?.description ? value?.dataValues?.description.replace(/<\/?[^>]+(>|$)/g, "") : "";
              clonedValue.onlineSalesOpen = value?.dataValues?.onlineSalesOpen;

              // Push the cloned object to final_response
              final_response.push(clonedValue);
          }
      });

      const response = {
          title: result.name,
          description: result?.description.replace(/<\/?[^>]+(>|$)/g, ""),
          rawdesc: result.description,
          thumbnail: result.header_img,
          date: availabilityDate,
          plans: final_response,
      };

      if (response.plans && response.plans.length > 0) {
          res.status(200).json(CommonFunction.succsMessage("success", response));
      } else {
          res.status(402).json(CommonFunction.errMessage("No data available"));
      }
  } catch (error) {
      console.error("Error fetching getAddonsProducts:", error);
      res.status(500).json(CommonFunction.errMessage("Internal server error"));
  }
};

export const updateProductStatus = async (req, res) => {
    const data = req.body;
  
    if (!data) {
        return res.status(200).json(CommonFunction.errMessage("Empty array is not acceptable."));
    }
    try {
        let updatedata = await updateStatus(data);
        if(updatedata.code) {
            res.status(200).json(CommonFunction.succsMessage("Status has been updated successfully.", [])); 
        } else {
            return res.status(200).json(CommonFunction.errMessage("There are some issues."));  
        }
    } catch (error) {
        console.error("Error fetching updateProductStatus:", error);
        res.status(200).json(CommonFunction.errMessage("Internal server error."));
    }
};