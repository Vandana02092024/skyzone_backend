import bcrypt from "bcrypt";
import {
  createUser,
  createUserLocations,
  findSingleUser,
  getUser,
  findSingleUserDetails,
  getAllUsers,
  getCount,
  updateUser,
  userDeactivated,
} from "../models/user.js";
import CommonFunction from "../../../../helper/common.js";

const salt = bcrypt.genSaltSync(10);

// # SIGNUP //
export const SignUp = async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const first_name = req.body.name;
  const password = req.body.password;
  const contact_number = req.body.contact;
  const timezone = req.body.timezone;
  const locations = req.body.location;
  const role = req.body.role;
  const created_by = req.user.user_id;

  if (!Array.isArray(locations) || locations.length === 0) {
    return res.status(200).json(CommonFunction.errMessage("locations array is required and cannot be empty"));
  }

  if (username && password && email && first_name) {
    const select = ["id", "first_name", "role"];
    const where = [{ username: username }];
    try {
      var exUser = await findSingleUser(select, where);
      var rsUser = {};

      if (!exUser.code) {
        var npassword = bcrypt.hashSync(password, salt);

        const newUser = {
          username: username,
          email: email,
          first_name: first_name,
          password: npassword,
          contact_number: contact_number,
          timezone: timezone,
          // client_id: locations,
          role: role,
          created_by:created_by
        };

        try {
          var crUser = await createUser(newUser);
          if (crUser?.code) {
            const userId = crUser.res.dataValues.id;
            await createUserLocations(locations,userId);
            res
              .status(200)
              .json(
                CommonFunction.succsMessage(
                  "User register successfully!",
                  crUser.code
                )
              );
            } else {
              res.status(200).json(CommonFunction.errMessage("No data found."));
            }
           
        } catch (error) {
          res
            .status(200)
            .json(
              CommonFunction.errMessage("Error : " + error, "Error : " + error)
            );
        }
      } else {
        res
          .status(200)
          .json(CommonFunction.succsMessage("User already exists.", []));
      }
    } catch (e) {
      res.status(200).json(CommonFunction.errMessage("User Fetch Error" + e));
    }
  } else res.status(200).json(CommonFunction.errMessage("Invalid arguments."));
};

// # FETCH USERS //
export const fetchUsers = async (req, res) => {
  var page = req.query.page ? parseInt(req.query.page) : 1;
  var items_per_page = req.query.items_per_page
    ? parseInt(req.query.items_per_page)
    : 50;
  var search = req.query.search;
  var search_query = search ? search : false;
  var status = req.query.status ? req.query.status : 1;
  var role = parseInt(req.user.role);
  const userId = req.user.user_id;
  let userRec;
  let totalRec;
  let total_pages;
  if (role === 1) {
     userRec = await getAllUsers(
      status,
      page,
      items_per_page,
      search_query
    ); 
    totalRec = await getCount(status, search_query);
    total_pages = Math.ceil(totalRec.data / items_per_page);
  } else {
     userRec = await getAllUsers(
      status,
      page,
      items_per_page,
      search_query,
      userId
    ); 
    totalRec = await getCount(status,userId, search_query);
    total_pages = Math.ceil(totalRec.data / items_per_page);
  }

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

// CHECK USER BY USERNAME //
export const checkUserExists = async (req, res) => {
  const username = req.body.username;
  const select = ["username"];
  const where = { username: username };
  const userRec = await getUser(select, where);

  if (userRec)
    res.status(200).json(
      CommonFunction.succsMessage("User already registered with us.", {
        found: true,
      })
    );
  else
    res
      .status(200)
      .json(CommonFunction.succsMessage("No data found.", { found: false }));
};

// FIND SIGLE USER
export const fetchSingleUser = async (req, res) => {
  const select = [
    "id",
    "first_name",
    "username",
    "email",
    "contact_number",
    "timezone",
    "role",
    // "client_id",
  ];

  const where = { id: req.query.id };
  const response = await findSingleUser(select, where,req.query.id);

  if (response.code)
    res.status(200).json(CommonFunction.succsMessage("Success!", response.res));
  else res.status(200).json(CommonFunction.errMessage("No data found."));
};

// user details

export const fetchSingleUserDetails = async (req, res) => {
  const select = [
    "id",
    "first_name",
    "username",
    "email",
    "contact_number",
    "timezone",
    "role",
    // "client_id",
  ];

  const where = { id: req.query.id };
  const response = await findSingleUserDetails(select, where,req.query.id);

  if (response.code)
    res.status(200).json(CommonFunction.succsMessage("Success!", response.res));
  else res.status(200).json(CommonFunction.errMessage("No data found."));
};

export const updateSingleUser = async (req, res) => {
  var role = parseInt(req.user.role);
  var userId = parseInt(req.user.user_id);
  const id = req.body.id;

  const select = ["id", "first_name", "role","created_by"];
  const where = [{ id: id }];

  const user = await getUser(select, where);
  const createdBy = user.created_by;


  // VALIDATE USER ROLE //
  if (role === 1 || userId===createdBy) {

    const uUser = {};
    if (req.body.hasOwnProperty("password")) {
      uUser.password = bcrypt.hashSync(req.body.password, salt);
    }

    if (
      req.body.email !== undefined ||
      req.body.email !== "" ||
      req.body.email !== null
    )
      uUser.email = req.body.email;
    if (
      req.body.name !== undefined ||
      req.body.name !== "" ||
      req.body.name !== null
    )
      uUser.first_name = req.body.name;
    if (
      req.body.contact !== undefined ||
      req.body.contact !== "" ||
      req.body.contact !== null
    )
      uUser.contact_number = req.body.contact;
    if (
      req.body.timezone !== undefined ||
      req.body.timezone !== "" ||
      req.body.timezone !== null
    )
      uUser.timezone = req.body.timezone;
    // if (
    //   req.body.location !== undefined ||
    //   req.body.location !== "" ||
    //   req.body.location !== null
    // )
      // uUser.client_id = req.body.location;
    if (
      req.body.role !== undefined ||
      req.body.role !== "" ||
      req.body.role !== null
    )
      uUser.role = req.body.role;
      uUser.updated_by = req.user.user_id;

      const locations = req.body.location;

    const upUser = await updateUser(uUser, id, locations);
    if (upUser.code)
      res
        .status(200)
        .json(
          CommonFunction.succsMessage(
            "User record updated successfully.",
            upUser.res
          )
        );
    else res.status(200).json(CommonFunction.errMessage("There is some issue"));
  } else
    res.status(200).json(CommonFunction.errMessage("You are not authorised."));
};

export const userDeactivate = async (req, res) => {
  const id = req.params.id;
  var role = parseInt(req.user.role);

  // VALIDATE ADMIN USER //
  if (role !== 1) {
    res
      .status(200)
      .json(CommonFunction.warningMessage("You are not authorized."));
  } else {
    try {
      const result = await userDeactivated(id);
      if (result.code) {
        res
          .status(200)
          .json(
            CommonFunction.succsMessage("User deactivated successfully!", [])
          );
      } else {
        res.status(200).json(CommonFunction.infoMessage(result.res));
      }
    } catch (error) {
      console.log("Error in userDeactivate", error);
      res.status(200).json(CommonFunction.errMessage("Internal server error"));
    }
  }
};
