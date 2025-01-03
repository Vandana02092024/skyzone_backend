import CommonFunction from "../../../../helper/common.js";
import {
  getRewardProducts,
  GetAllProducts,
  addReward,
  getCategoryByPoints,
  updateReward,
  deleteReward,
} from "../models/rewards.js";

export const fetchRewardProducts = async (req, res) => {
  const search = req.query.search || false;
  const location_id = req.query.location_id;

  var page = req.query.page ? parseInt(req.query.page) : 1;
  var items_per_page = req.query.items_per_page
    ? parseInt(req.query.items_per_page)
    : 50;

  if (!location_id) {
    res.status(400).json(CommonFunction.errMessage("Location ID is required"));
  }

  const products = await getRewardProducts(
    location_id,
    page,
    items_per_page,
    search
  );

  if (products.code) {
    res.status(200).json(CommonFunction.succsMessage("sucess", products.res));
  } else {
    res.status(400).json(CommonFunction.errMessage(products.res));
  }
};

export const fetchLocationProducts = async (req, res) => {
  const search = req.query.search || false;
  const location_id = req.query.location_id;

  var page = req.query.page ? parseInt(req.query.page) : 1;
  var items_per_page = req.query.items_per_page
    ? parseInt(req.query.items_per_page)
    : 10;

  if (!location_id) {
    res.status(400).json(CommonFunction.errMessage("Location ID is required"));
  }

  const products = await GetAllProducts(
    location_id,
    page,
    items_per_page,
    search
  );

  if (products.code) {
    res.status(200).json(CommonFunction.succsMessage("sucess", products.res));
  } else {
    res.status(400).json(CommonFunction.errMessage(products.res));
  }
};

export const addRewardRule = async (req, res) => {
  const nReward = {
    client_id: req.body.client_id,
    discount_code: req.body.discount_code,
    product_id: req.body.product_id,
    title: req.body.title,
    points: req.body.points,
  };

  if (req.fileLocation !== "undefined" || req.fileLocation !== null)
    nReward.thumbnail = req.fileLocation;

  if (
    nReward.client_id === undefined ||
    nReward.discount_code === undefined ||
    nReward.product_id === undefined ||
    nReward.title === undefined ||
    nReward.points === undefined
  ) {
    return res
      .status(400)
      .json(CommonFunction.errMessage("All fields are required"));
  }

  const catNo = await getCategoryByPoints(nReward.points);
  nReward.category_id = catNo.code ? catNo.res : 1;
  const data = await addReward(nReward);

  if (data.code) {
    res.status(200).json(CommonFunction.succsMessage("sucess", data.res));
  } else {
    res.status(400).json(CommonFunction.errMessage("ERROR: " + data.res));
  }
};

export const updateRewardRule = async (req, res) => {
  const uReward = {
    client_id: req.body.client_id,
    discount_code: req.body.discount_code,
    product_id: req.body.product_id,
    title: req.body.title,
    points: req.body.points,
  };
  var removeThumbnail = false;

  const catNo = await getCategoryByPoints(uReward.points);
  uReward.category_id = catNo.code ? catNo.res : 1;

  if (req.fileLocation !== "undefined" || req.fileLocation !== null) {
    removeThumbnail = true;
    uReward.thumbnail = req.fileLocation;
  }

  const id = req.body.id;
  const result = await updateReward(uReward, id, removeThumbnail);

  if (result.code) {
    res.status(200).json(CommonFunction.succsMessage("sucess", result.res));
  } else {
    res.status(400).json(CommonFunction.errMessage(result.res));
  }
};

export const deleteRewardRule = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await deleteReward(id);
    if (result.code) {
      res
        .status(200)
        .json(CommonFunction.succsMessage("Record deleted successfully!", []));
    } else {
      res.status(200).json(CommonFunction.warningMessage(result.res));
    }
  } catch (error) {
    console.log("Error in deleteRewardRule", error);
    res.status(200).json(CommonFunction.errMessage("Internal server error"));
  }
};
