import CommonFunction from "../../../../helper/common.js";
import { GetAllLocations, GetLocationByUser , getCustomesQueriesData, getGeneralQueriesData } from "../models/home.js";

export const FetchLocation = async (req, res) => {
  const role = req.user.role;
  const user_id = req.user.user_id;

  //  Not Admin user
  if (role !== 1) {
    var result = await GetLocationByUser(user_id);
  } else {
    var result = await GetAllLocations();
  }
  if (result.code) {
    res.status(200).json(CommonFunction.succsMessage("sucess", result.res));
  } else
    res
      .status(401)
      .json(CommonFunction.errMessage("There is some server error."));
};

// Apis for Customer Queries

export const getCustomerQueries = async (req, res) => {
  try {
    // Destructure query parameters with default values
    const {
      status = null,
      search = '',
      client_id = null,
      page = 1,
      items_per_page = 10,
    } = req.query;

    // if (!client_id) {
    //   return res.status(400).json(CommonFunction.errMessage("Client ID is required."));
    // }

    const filters = {
      status,
      page: parseInt(page),
      items_per_page: parseInt(items_per_page),
      search,
    };

    const data = await getCustomesQueriesData(client_id, filters);

    if (data && data.code) {
      res.status(200).json(CommonFunction.succsMessage("Success", data.res));
    } else {
      res.status(200).json(CommonFunction.errMessage(data?.res || "No records found."));
    }
  } catch (err) {
    console.error("Error fetching customer queries:", err);
    return res
      .status(500)
      .json(CommonFunction.errMessage("Error while fetching customer queries."));
  }
};

export const getGeneralQueries = async (req, res) => {
  try {
    // Destructure query parameters with default values
    const {
      search = '',
      page = 1,
      items_per_page = 10,
    } = req.query;

    const filters = {
      page: parseInt(page),
      items_per_page: parseInt(items_per_page),
      search,
    };

    const data = await getGeneralQueriesData(filters);

    if (data && data.code) {
      res.status(200).json(CommonFunction.succsMessage("Success", data.res));
    } else {
      res.status(200).json(CommonFunction.errMessage(data?.res || "No records found."));
    }
  } catch (err) {
    console.error("Error fetching general queries:", err);
    return res
      .status(500)
      .json(CommonFunction.errMessage("Error while fetching general queries."));
  }
};
