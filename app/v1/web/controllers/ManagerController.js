import bcrypt from "bcrypt";
import {
  createManager,
  getAllManagers,
  getCount,
  findSingleManager,
  getManager,
  updateManager,
  ManagerDeactivated
} from "../models/manager.js";
import CommonFunction from "../../../../helper/common.js";

const salt = bcrypt.genSaltSync(10);

// # SIGNUP //
export const createNewManager = async (req, res) => {
  try {
  const fname = req.body.fname;
  const lname = req.body.lname;
  const email = req.body.email;
  const contact = req.body.contact;
  const designation = req.body.designation;
  const client_id = req.body.client_id;
  const created_by = req.user.user_id;

  if (!fname) {
    return res.status(200).json(CommonFunction.errMessage("First name is required"));
  }
  if (!lname) {
    return res.status(200).json(CommonFunction.errMessage("Last name is required"));
  }
  if (!email) {
    return res.status(200).json(CommonFunction.errMessage("Email is required"));
  }
  if (!contact) {
    return res.status(200).json(CommonFunction.errMessage("Contact number is required"));
  }
  if (!client_id) {
    return res.status(200).json(CommonFunction.errMessage("Location is required"));
  }

  const newRecord = {
    fname: fname,
    lname: lname,
    email: email,
    contact: contact,
    designation: designation ?? '',
    client_id: client_id,
    created_by:created_by
  };

  const addManager = await createManager(newRecord);
  if(addManager?.code) {
    return res.status(200).json(CommonFunction.succsMessage("Manager created successfully.", addManager.res));
  } else {
    return res.status(200).json(CommonFunction.errMessage("Failed to create manager."));
  }

 } catch (e) {
    res.status(200).json(CommonFunction.errMessage("User Fetch Error" + e));
  }
};

// # FETCH USERS //
export const fetchManagers = async (req, res) => {
  var page = req.query.page ? parseInt(req.query.page) : 1;
  var items_per_page = req.query.items_per_page
    ? parseInt(req.query.items_per_page)
    : 10;
  var search = req.query.search;
  var search_query = search ? search : false;
  var status = req.query.status ? req.query.status : 1;
  var client_id = req.query.client_id;
  if(!client_id) {
    return res.status(200).json(CommonFunction.errMessage("Client ID is required."));
  }

  let userRec;
  let totalRec;
  let total_pages;

  userRec = await getAllManagers(
    status,
    page,
    items_per_page,
    search_query,
    client_id
  ); 
  totalRec = await getCount(status,client_id, search_query);
  total_pages = Math.ceil(totalRec.data / items_per_page);

    if (userRec.code)
      res.status(200).json(
        CommonFunction.succsMessage("Success!", {
          page: page,
          total_pages: total_pages,
          listing: userRec.res,
        })
      );
    else res.status(200).json(CommonFunction.errMessage("No data found."));
};

// FIND SIGLE USER
export const fetchSingleManager = async (req, res) => {
  const select = [
    "id",
    "fname",
    "lname",
    "email",
    "contact",
    "designation",
    "status",
    "client_id",
  ];

  const where = { id: req.query.id };
  const response = await findSingleManager(select, where);

  if (response.code)
    res.status(200).json(CommonFunction.succsMessage("Success!", response.res));
  else res.status(200).json(CommonFunction.errMessage("No data found."));
};

export const updateSingleManager = async (req, res) => {
  var role = parseInt(req.user.role);
  var userId = parseInt(req.user.user_id);
  const id = req.body.id;
  if(!id) {
    return res.status(200).json(CommonFunction.errMessage("Manager ID is required"));
  }

  const select = ["id", "first_name", "role","created_by"];
  const where = [{ id: id }];

  const checkmanager = await getManager(select, where);
  const createdBy = checkmanager.created_by;


  // VALIDATE USER ROLE //
  if (role === 1 || userId===createdBy) {

    const uUser = {};

    if (
      req.body.fname !== undefined ||
      req.body.fname !== "" ||
      req.body.fname !== null
    )
      uUser.fname = req.body.fname;
    if (
        req.body.lname !== undefined ||
        req.body.lname !== "" ||
        req.body.lname !== null
      )
      uUser.lname = req.body.lname;

    if (
      req.body.email !== undefined ||
      req.body.email !== "" ||
      req.body.email !== null
    )
      uUser.email = req.body.email;
    if (
      req.body.contact !== undefined ||
      req.body.contact !== "" ||
      req.body.contact !== null
    )
      uUser.contact = req.body.contact;
    // if (
    //   req.body.designation !== undefined ||
    //   req.body.designation !== "" ||
    //   req.body.designation !== null
    // )
    //   uUser.designation = req.body.designation;
    if (
      req.body.client_id !== undefined ||
      req.body.client_id !== "" ||
      req.body.client_id !== null
    )
      uUser.client_id = req.body.client_id;

    const upUser = await updateManager(uUser, id);
    if (upUser.code)
      res
        .status(200)
        .json(
          CommonFunction.succsMessage(
            "Manager record updated successfully.",
            upUser.res
          )
        );
    else res.status(200).json(CommonFunction.errMessage("There is some issue"));
  } else
    res.status(200).json(CommonFunction.errMessage("You are not authorised."));
};

export const userDeactivate = async (req, res) => {
  const id = req.query.id;
  if(!id) {
      return res.status(200).json(CommonFunction.errMessage("Manager ID is required"));
  }
  try {
    const result = await ManagerDeactivated(id);
    if (result.code) {
      res
        .status(200)
        .json(
          CommonFunction.succsMessage("Manager status has been change successfully!", [])
        );
    } else {
      res.status(200).json(CommonFunction.infoMessage(result.res));
    }
  } catch (error) {
    console.log("Error in userDeactivate", error);
    res.status(200).json(CommonFunction.errMessage("Internal server error"));
  }
};
