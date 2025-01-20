import CommonFunction from "../../../../helper/common.js";
import {
  CreateAddon,
  getAddons,
  GetAllProducts,
  GetCount,
  GetProductsCount,
  SelectAddonBy,
  deleteAddonRecord
} from "../models/addons.js";
import productService from "../../models/products.js";

export const getAllAddons = async (req, res) => {
  const location_id = req.query.location_id;
  const card_id = req.query.card_id;
  const search = req.query.search || false;

  var page = req.query.page ? parseInt(req.query.page) : 1;
  var items_per_page = req.query.items_per_page
    ? parseInt(req.query.items_per_page)
    : 50;

  if (!location_id) {
    res.status(400).json(CommonFunction.errMessage("Location ID is required"));
  }

  const result = await getAddons(
    location_id,
    card_id,
    page,
    items_per_page,
    search
  );
  const totalRec = await GetCount(location_id, card_id);
  const total_pages = Math.ceil(totalRec.data / items_per_page);

  if (result.code) {
    res.status(200).json(
      CommonFunction.succsMessage("sucess", {
        page: page,
        total_pages: total_pages,
        listing: result.res,
      })
    );
  } else {
    res.status(400).json(CommonFunction.errMessage(result.res));
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
  const totalRec = GetProductsCount(location_id);
  const total_pages = Math.ceil(totalRec.data / items_per_page);

  if (products.code) {
    res.status(200).json(
      CommonFunction.succsMessage("sucess", {
        page: page,
        total_pages: total_pages,
        listing: products.res,
      })
    );
  } else {
    res.status(400).json(CommonFunction.errMessage(products.res));
  }
};

export const createNewAddon = async (req, res) => {
  const nAddon = {
    pid: req.body.product_id,
    parent_id: req.body.parent_id,
    card_id: req.body.card_id,
    client_id: req.body.client_id,
  };

  if (
    nAddon.pid === undefined ||
    nAddon.parent_id === undefined ||
    nAddon.card_id === undefined ||
    nAddon.client_id === undefined
  ) {
    return res
      .status(400)
      .json(CommonFunction.errMessage("All fields are required"));
  }

  const ex = await SelectAddonBy(["id"], {
    pid: nAddon.pid,
    parent_id: nAddon.parent_id,
    client_id: nAddon.client_id,
    card_id: nAddon.card_id,
  });

  if (ex.code)
    res
      .status(200)
      .json(
        CommonFunction.infoMessage("This record already exists in the system.")
      );
  else {
    const data = await CreateAddon(nAddon);

    if (data.code) {
      res
        .status(200)
        .json(
          CommonFunction.succsMessage(
            "The addon has been added successfully.",
            data.res
          )
        );
    } else {
      res.status(400).json(CommonFunction.errMessage("ERROR: " + data.res));
    }
  }
};

export const deleteAddon = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await deleteAddonRecord(id);
    if (result.code) {
      res.status(200).json(CommonFunction.succsMessage("sucess", []));
    } else {
      res.status(400).json(CommonFunction.errMessage(result.res));
    }
  } catch (error) {
    console.log('Error in deleteAddon',error);
    res.status(500).json(CommonFunction.errMessage('Internal server error'));
  }
}

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

      const productDt = await productService.getAvailableProducts(client_id);

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
