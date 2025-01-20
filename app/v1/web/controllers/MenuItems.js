import CommonFunction from "../../../../helper/common.js";
import {
  getMenuItems,
  GetAllProducts,
  addMenuItem,
  updateMenuItem,
  SelectItem,
  deleteMenuItem,
} from "../models/menuitems.js";

export const fetchMenuItems = async (req, res) => {
  const search = req.query.search || false;
  const location_id = req.query.location_id;

  var page = req.query.page ? parseInt(req.query.page) : 1;
  var items_per_page = req.query.items_per_page
    ? parseInt(req.query.items_per_page)
    : 10;

  if (!location_id) {
    res.status(400).json(CommonFunction.errMessage("Location ID is required"));
  }

  const products = await getMenuItems(
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

export const addMenuItems = async (req, res) => {
  const nMenuItem = {
    title: req.body.title,
    description: req.body.description,
    price: parseFloat(req.body.price),
    product_id: parseInt(req.body.product_id),
    parent_product_id: parseInt(req.body.parent_product_id),
    client_id: parseInt(req.body.client_id),
  };

  if (req.fileLocation !== "undefined" || req.fileLocation !== null)
    nMenuItem.thumbnail = req.fileLocation;

  if (
    nMenuItem.title === undefined ||
    nMenuItem.description === undefined ||
    nMenuItem.price === undefined ||
    nMenuItem.product_id === undefined ||
    nMenuItem.parent_product_id === undefined ||
    nMenuItem.client_id === undefined
  ) {
    return res
      .status(400)
      .json(CommonFunction.errMessage("All fields are required"));
  }

  const ex = await SelectItem(["id"], {
    product_id: nMenuItem.product_id,
    parent_product_id: nMenuItem.parent_product_id,
    client_id: nMenuItem.client_id,
  });

  if (ex.code)
    res
      .status(200)
      .json(
        CommonFunction.infoMessage("This record already exists in the system.")
      );
  else {
    const data = await addMenuItem(nMenuItem);

    if (data.code) {
      res
        .status(200)
        .json(
          CommonFunction.succsMessage(
            "The menu item has been added successfully.",
            data.res
          )
        );
    } else {
      res.status(400).json(CommonFunction.errMessage("ERROR: " + data.res));
    }
  }
};

export const updateMenuItems = async (req, res) => {
  const uReward = {
    title: req.body.title,
    description: req.body.description,
  };
  var removeThumbnail = false;

  if (req.fileLocation !== "undefined" || req.fileLocation !== null) {
    removeThumbnail = true;
    uReward.thumbnail = req.fileLocation;
  }

  const id = req.body.id;
  const result = await updateMenuItem(uReward, id, removeThumbnail);

  if (result.code) {
    res.status(200).json(CommonFunction.succsMessage("sucess", result.res));
  } else {
    res.status(400).json(CommonFunction.errMessage(result.res));
  }
};

export const deleteMenuItems = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await deleteMenuItem(id);
    if (result.code) {
      res
        .status(200)
        .json(CommonFunction.succsMessage("Record deleted successfully!", []));
    } else {
      res.status(200).json(CommonFunction.infoMessage(result.res));
    }
  } catch (error) {
    console.log("Error in deleteMenuItems", error);
    res.status(200).json(CommonFunction.errMessage("Internal server error"));
  }
};
