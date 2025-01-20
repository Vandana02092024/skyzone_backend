import CommonFunction from "../../../../helper/common.js";
import {
  Add,
  findAll,
  UpdateById,
  Remove,
  GetById,
} from "../models/pushnotifications.js";

export const fetchAllNotifications = async (req, res) => {
  var page = req.query.page ? parseInt(req.query.page) : 1;
  var items_per_page = req.query.items_per_page
    ? parseInt(req.query.items_per_page)
    : 50;
  var search = req.query.search ? req.query.search : false;
  const rec = await findAll(page, items_per_page, search);

  if (rec.code)
    res.status(200).json(
      CommonFunction.succsMessage("Success!", {
        page: page,
        total_pages: rec.total_pages,
        listing: rec.listing,
      })
    );
  else res.status(200).json(CommonFunction.infoMessage("No record found."));
};

export const addNotification = async (req, res) => {
  const indata = req.body;

  if (!req.body.hasOwnProperty("title"))
    res.status(200).json(CommonFunction.warningMessage("Title is required"));

  if (!req.body.hasOwnProperty("message"))
    res.status(200).json(CommonFunction.warningMessage("Message is required"));

  if (!req.body.hasOwnProperty("date_to_notify"))
    res.status(200).json(CommonFunction.warningMessage("Date is required"));

  if (!req.body.hasOwnProperty("time_to_notify"))
    res.status(200).json(CommonFunction.warningMessage("Time is required"));

  if (!req.body.hasOwnProperty("cust_timezone"))
    res.status(200).json(CommonFunction.warningMessage("Timezone is required"));

  if (req.body.hasOwnProperty("id")) {
    delete req.body.id;
  }

  const notification = await Add(indata);

  if (notification.code) {
    res
      .status(200)
      .json(CommonFunction.succsMessage("Record created successfully!"));
  } else {
    res.status(200).json(CommonFunction.infoMessage("Can't create new record"));
  }
};

export const updateNotification = async (req, res) => {
  if (req.body.hasOwnProperty("id")) {
    const id = req.body.id;
    delete req.body.id;

    const upData = req.body;

    const notification = await UpdateById(upData, id);
    if (notification.code) {
      res
        .status(200)
        .json(
          CommonFunction.succsMessage(
            "Record updated successfully!",
            notification.res
          )
        );
    } else {
      res.status(200).json(CommonFunction.infoMessage("Can't update data."));
    }
  } else {
    res.status(200).json(CommonFunction.warningMessage("Id is required"));
  }
};

export const fetchSingle = async (req, res) => {
  const notificationID = req.params.id;
  if (notificationID) {
    const notification = await GetById(notificationID);
    if (notification.code) {
      res.status(200).json({
        message: "Record fetched successfully!",
        data: notification.res,
      });
    } else {
      res.status(400).json({
        message: "There is some issue while fetching the record.",
        data: false,
      });
    }
  } else {
    res.status(400).json({
      message: "Id is required",
      data: false,
    });
  }
};

export const deleteRecord = async (req, res) => {
  const notificationID = req.params.id;
  if (notificationID) {
    const result = await Remove(notificationID);

    if (result.code) {
      res
        .status(200)
        .json(CommonFunction.succsMessage("Record deleted successfully!", []));
    } else {
      res.status(200).json(CommonFunction.warningMessage(result.res));
    }
  }
};
