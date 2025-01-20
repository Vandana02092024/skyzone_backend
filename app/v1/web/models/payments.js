import { ClientMaster, MobileBookings } from "../../../../config/tables.js";

export const getStripeId = async (location_id) => {
  try {
    const results = await ClientMaster.findOne({
      attributes: ["stripe_account_id"],
      where: { client_id: location_id },
    });

    if (Object.keys(results).length === 0)
      return { code: false, res: "No record found." };
    else return { code: true, res: results };
  } catch (error) {
    return { code: false, res: error.message };
  }
};

export const getClientDetail = async (where) => {
  try {
    const result = await ClientMaster.findAll({
      attributes: [
        "client_id",
        "client_name",
        "location",
        "address",
        "stripe_account_id",
      ],
      where: where,
    });
    if (Object.keys(result).length === 0)
      return { code: false, res: "No record found." };
    else return { code: true, res: result };
  } catch (error) {
    return { code: false, res: error.message };
  }
};

export const findMobileBooking = async (select, where) => {
  try {
    const result = await MobileBookings.findOne({
      attributes: select,
      where: where,
    });

    if (Object.keys(result).length === 0)
      return { code: false, res: "No record found." };
    else return { code: true, res: result };
  } catch (error) {
    return { code: false, res: error.message };
  }
};

export const updateMobileBooking = async (upRecord, where) => {
  try {
    const result = await MobileBookings.update(upRecord, {
      where: where,
    });

    if (Object.keys(result).length === 0)
      return { code: false, res: "There is some issue." };
    else return { code: true, res: result };
  } catch (error) {
    return { code: false, res: error.message };
  }
};
