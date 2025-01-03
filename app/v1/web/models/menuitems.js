import {
  RestaurantMenuItem,
  RestProducts,
  RestProductParent,
} from "../../../../config/tables.js";
import { Op } from "sequelize";
import dotenv from "dotenv";
import { deleteFileFromS3 } from "../../../../helper/uploadMiddleware.js";

dotenv.config();

export const getMenuItems = async (
  location_id,
  page,
  items_per_page,
  search = false
) => {
  var where = { client_id: location_id };
  if (search !== false) {
    where = {
      [Op.or]: [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        {
          price: {
            [Op.between]: [parseInt(search) - 10, parseInt(search) + 10],
          },
        },
      ],
      client_id: location_id,
    };
  }
  try {
    const results = await RestProductParent.findAll({
      attributes: ["name", "shortDescription", "Pid"],
      include: [
        {
          model: RestProducts,
          attributes: ["Pid", "parent_id", "name", "imageUrl", "cost"],
          required: true,
          include: [
            {
              model: RestaurantMenuItem,
              required: true,
              as: "restaurantMenuItems",
              attributes: [
                "id",
                "description",
                ["thumbnail", "parent_img"],
                "price",
                "title",
              ],
              where: where,
            },
          ],
        },
      ],
    });

    if (Object.keys(results).length === 0)
      return { code: false, res: "No record found." };
    else return { code: true, res: results };
  } catch (error) {
    return { code: false, res: error.message };
  }
};

// GET COUNT //
export const GetCount = async (location_id, search = false) => {
  var where = { client_id: location_id };
  if (search !== false) {
    where = {
      [Op.or]: [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        {
          price: {
            [Op.between]: [parseInt(search) - 10, parseInt(search) + 10],
          },
        },
      ],
      client_id: location_id,
    };
  }
  try {
    const res = await RestaurantMenuItem.count({
      where: where,
    });

    if (res) return { status: true, data: res };
    else return { status: false, data: [] };
  } catch (error) {
    return { code: false, res: err.message };
  }
};

export const GetAllProducts = async (
  location_id,
  page,
  items_per_page,
  search
) => {
  try {
    var where = { client_id: location_id };
    if (search !== false) {
      where = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ],
        client_id: location_id,
      };
    }

    const results = await RestProductParent.findAll({
      attributes: ["name", "shortDescription", "Pid"],
      where: where,
      include: [
        {
          model: RestProducts,
          attributes: ["Pid", "name", "imageUrl", "cost", "parent_id"],
          where: where,
          include: [
            {
              model: RestaurantMenuItem,
              required: false,
              as: "restaurantMenuItems",
              attributes: [
                "id",
                "description",
                ["thumbnail", "parent_img"],
                "price",
                "title",
              ],
              // where: where,
            },
          ],
        },
      ],
      offset: (page - 1) * items_per_page,
      limit: items_per_page,
    });

    if (Object.keys(results).length === 0)
      return { code: false, res: "No record found." };
    else return { code: true, res: results };
  } catch (error) {
    return { code: false, res: error.message };
  }
};

export const addMenuItem = async (nMenuItem) => {
  try {
    const result = await RestaurantMenuItem.create(nMenuItem);

    if (!result) return { code: false, res: "Can't create new record." };
    else return { code: true, res: result };
  } catch (error) {
    return { code: false, res: error.message };
  }
};

export const updateMenuItem = async (
  uMenuItem,
  id,
  removeThumbnail = false
) => {
  const existingOffer = await RestaurantMenuItem.findOne({
    where: { id: id },
  });

  if (!existingOffer) return { code: false, res: "Menu item not found" };

  // RMOVE IMAGE FROM S3 BUCKET IF ALREADY EXITS //
  if (
    existingOffer.thumbnail !== null &&
    existingOffer.thumbnail !== "" &&
    removeThumbnail
  ) {
    // CHECKING IF IT IS A S3 BUCKET URL
    const thumbnail = existingOffer.thumbnail;
    if (thumbnail.includes("amazonaws") !== -1) {
      deleteFileFromS3(process.env.RIVETTE_BUCKET, `menuItems/${thumbnail}`);
    }
  }

  try {
    const affectedRows = await RestaurantMenuItem.update(uMenuItem, {
      where: { id: id },
    });

    if (!affectedRows) return { code: false, res: "Error updating record." };
    else return { code: true, res: affectedRows };
  } catch (error) {
    return { code: false, res: error.message };
  }
};

export const SelectItem = async (select, where) => {
  try {
    const item = await RestaurantMenuItem.findAll({
      attributes: select,
      where: where,
    });

    if (Object.keys(item).length === 0)
      return { code: false, res: "No record found." };
    else return { code: true, res: item };
  } catch (error) {}
};

export const deleteMenuItem = async (id) => {
  try {
    const existingRecord = await RestaurantMenuItem.findOne({
      where: { id: id },
    });
    if (!existingRecord) return { code: false, res: "Menu item not found" };

    // RMOVE IMAGE FROM S3 BUCKET IF ALREADY EXITS //
    if (existingRecord.thumbnail !== null && existingRecord.thumbnail !== "") {
      const thumbnail = existingRecord.thumbnail;
      if (thumbnail.includes("amazonaws") !== -1) {
        deleteFileFromS3(process.env.RIVETTE_BUCKET, `menuItems/${thumbnail}`);
      }
    }
    const result = await RestaurantMenuItem.destroy({
      where: {
        id: id,
      },
    });

    if (!result) return { code: false, res: "Can't delete record." };
    else return { code: true, res: result };
  } catch (error) {
    return { code: false, res: error.message };
  }
};