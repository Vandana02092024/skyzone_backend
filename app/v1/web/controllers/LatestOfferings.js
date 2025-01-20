import CommonFunction from "../../../../helper/common.js";
import { Op } from "sequelize";
import {
  getLatestOffers,
  getLatestOfferDetails,
  checkLatestOffer,
  updateLatestOffer,
  addLatestOffer,
  getProductsWithParent,
  deleteOfferProducts,
  updateOffersStatus,
  deleteOfferWithProducts,
} from "../models/latestOffers.js";

export const getOfferDetails = async (req, res) => {
  const offerId = req.query.id;
  try {
    const latest_offerings = await getLatestOfferDetails(offerId);

    if (latest_offerings) {
      return res
        .status(200)
        .json(CommonFunction.succsMessage("success", latest_offerings));
    } else {
      return res
        .status(400)
        .json(CommonFunction.errMessage("latest_offerings not found"));
    }
  } catch (error) {
    console.error("Error fetching latest_offerings:", error);
    return res
      .status(500)
      .json(CommonFunction.errMessage("Error while fetching latest_offerings"));
  }
};

export const getLatestOfferingsOrder = async (req, res) => {
  try {
    let status = req.query.status ? req.query.status : "1";

    let page = req.query.page ? parseInt(req.query.page) : 1;
    let items_per_page = req.query.items_per_page
      ? parseInt(req.query.items_per_page)
      : 10;
    const location_id = req.query.location_id;

    if (!location_id) {
      return res
        .status(400)
        .json(CommonFunction.errMessage("Location ID is required"));
    }

    const latest_offerings = await getLatestOffers(
      location_id,
      status,
      page,
      items_per_page
    );
    const total_pages = Math.ceil(latest_offerings.total / items_per_page);
    const data = latest_offerings.items;
    const response = {
      offers: data,
      page: page,
      total_pages: total_pages,
    };

    if (response) {
      return res
        .status(200)
        .json(CommonFunction.succsMessage("success", response));
    } else {
      return res
        .status(404)
        .json(CommonFunction.errMessage("No offerings found"));
    }
  } catch (error) {
    console.error("Error fetching latest offerings:", error);
    return res
      .status(500)
      .json(CommonFunction.errMessage("Error while fetching latest offerings"));
  }
};

export const updateOffer = async (req, res) => {
  try {
    const offerId = req.body.id;
    const data = req.body;
    let image = "";
    if (req.fileLocation !== "undefined" || req.fileLocation !== null) {
      image = req.fileLocation;
    }

    const existingOffer = await checkLatestOffer(offerId);

    if (!existingOffer) {
      return res
        .status(404)
        .json(CommonFunction.errMessage("existingOffer not found"));
    }

    const result = await updateLatestOffer(data, offerId, image);

    if (result) {
      return res
        .status(200)
        .json(CommonFunction.succsMessage("Updated record(s)", result));
    } else {
      return res
        .status(200)
        .json(CommonFunction.errMessage("No changes were made to the record"));
    }
  } catch (error) {
    console.error("Error updating offerId:", error);
    return res
      .status(500)
      .json(CommonFunction.errMessage("Error while updating offerId"));
  }
};

export const AddOffer = async (req, res) => {
  try {
    const offerId = req.body.id;
    const data = req.body;

    const selected_products = req.body.selected_products;

    let image = "";
    if (req.fileLocation !== "undefined" || req.fileLocation !== null) {
      image = req.fileLocation;
    }

    const result = await addLatestOffer(data, image);

    if (result) {
      return res
        .status(200)
        .json(CommonFunction.succsMessage("Insert record(s)", result));
    } else {
      return res
        .status(200)
        .json(CommonFunction.errMessage("Could not save the record"));
    }
  } catch (error) {
    console.error("Error in insert offer:", error);
    return res
      .status(500)
      .json(CommonFunction.errMessage("Error while insert offer"));
  }
};

export const getProductsWithParentInfo = async (req, res) => {
  const location_id = req.query.location_id;
  const offer_type = req.query.offer_type;
  let typeCondition;
  if (offer_type === "1") {
    typeCondition = { type: "membership" };
  } else if (offer_type === "2") {
    typeCondition = {
      [Op.or]: [{ type: "pass" }, { type: "sessionpass" }],
    };
  } else {
    typeCondition = { type: "package" };
  }
  try {
    const results = await getProductsWithParent(location_id, typeCondition);
    return res
      .status(200)
      .json(CommonFunction.succsMessage("success", results));
  } catch (error) {
    console.error("Error fetching parent products:", error);
    return res
      .status(500)
      .json(CommonFunction.errMessage("Error while fetching parent products"));
  }
};

export const deleteOfferProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const result = await deleteOfferProducts(id);
    if (result) {
      return res
        .status(200)
        .json(
          CommonFunction.succsMessage("Product deleted successfully!", result)
        );
    } else {
      return res
        .status(200)
        .json(CommonFunction.infoMessage("Please try again.."));
    }
  } catch (error) {
    console.log("Error deleting offer product:", error);
    return res
      .status(200)
      .json(CommonFunction.errMessage("Error while deleting offer product"));
  }
};

export const updateOfferStatus = async (req, res) => {
  try {
    const offerId = req.body.id;
    const status = parseInt(req.body.status);
    let statusUp;
    if (status === 1) {
      statusUp = "0";
    } else if (status === 0) {
      statusUp = "1";
    }
    const existingOffer = await checkLatestOffer(offerId);

    if (!existingOffer) {
      return res
        .status(404)
        .json(CommonFunction.errMessage("existingOffer not found"));
    }
    const affectedRows = await updateOffersStatus(statusUp, offerId);

    if (affectedRows) {
      return res
        .status(200)
        .json(CommonFunction.succsMessage("Updated", affectedRows));
    } else {
      return res
        .status(200)
        .json(CommonFunction.errMessage("No changes were made to the record"));
    }
  } catch (error) {
    console.error("Error updating status:", error);
    return res
      .status(500)
      .json(CommonFunction.errMessage("Error while updating status"));
  }
};

export const deleteOffer = async (req, res) => {
  const offerId = req.params.id;
  res
    .status(200)
    .json(
      CommonFunction.succsMessage(
        "Offer deleted successfully!",
        latest_offerings
      )
    );
};
