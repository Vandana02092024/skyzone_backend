import {
  MobileDiscountProduct,
  RestProducts,
  RestProductParent,
  Category,
} from "../../../../config/tables.js";
import { Op } from "sequelize";
import dotenv from "dotenv";
import { deleteFileFromS3 } from "../../../../helper/uploadMiddleware.js";

dotenv.config();

export const getRewardProducts = async (
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
        { discount_code: { [Op.like]: `%${search}%` } },
        { points: { [Op.like]: `%${search}%` } },
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
          attributes: ["Pid", "parent_id", "name", "imageUrl"],
          required: true,
          include: [
            {
              model: MobileDiscountProduct,
              required: true,
              as: "ProdcutsDiscount",
              attributes: [
                "id",
                "discount_code",
                ["thumbnail", "parent_img"],
                "points",
                "title",
                "discount_code",
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
        { discount_code: { [Op.like]: `%${search}%` } },
        { points: { [Op.like]: `%${search}%` } },
      ],
      client_id: location_id,
    };
  }
  try {
    const res = await MobileDiscountProduct.count({
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
          attributes: ["Pid", "name", "imageUrl"],
          where: where,
          include: [
            {
              model: MobileDiscountProduct,
              required: false,
              as: "ProdcutsDiscount",
              attributes: [
                "id",
                "discount_code",
                ["thumbnail", "parent_img"],
                "points",
                "title",
                "discount_code",
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

export const addReward = async (nReward) => {
  try {
    const result = await MobileDiscountProduct.create(nReward);

    if (!result) return { code: false, res: "Can't create new record." };
    else return { code: true, res: result };
  } catch (error) {
    return { code: false, res: error.message };
  }
};

export const getCategoryByPoints = async (points) => {
  try {
    if (!points) return { code: false, res: "Points are required" };

    const category = await Category.findOne({
      attributes: ["CatNo"],
      where: {
        minRange: {
          [Op.lte]: points,
        },
        maxRange: {
          [Op.gte]: points,
        },
      },
      order: [["CatNo", "ASC"]],
    });

    if (!category) return { code: false, res: "Error fetching categories." };
    else return { code: true, res: category.CatNo };
  } catch (error) {
    return { code: false, res: error.message };
  }
};

export const updateReward = async (uReward, id, removeThumbnail = false) => {
  const existingOffer = await MobileDiscountProduct.findOne({
    where: { id: id },
  });

  if (!existingOffer) return { code: false, res: "MobileDiscount not found" };

  // RMOVE IMAGE FROM S3 BUCKET IF ALREADY EXITS //
  if (
    existingOffer.thumbnail !== null &&
    existingOffer.thumbnail !== "" &&
    removeThumbnail
  ) {
    // CHECKING IF IT IS A S3 BUCKET URL
    const thumbnail = existingOffer.thumbnail;
    if (thumbnail.includes("amazonaws") !== -1) {
      deleteFileFromS3(process.env.RIVETTE_BUCKET, `rewards/${thumbnail}`);
    }
  }

  try {
    const affectedRows = await MobileDiscountProduct.update(uReward, {
      where: { id: id },
    });

    if (!affectedRows) return { code: false, res: "Error updating record." };
    else return { code: true, res: affectedRows };
  } catch (error) {
    return { code: false, res: error.message };
  }
};

export const deleteReward = async (id) => {
  try {
    const existingOffer = await MobileDiscountProduct.findOne({
      where: { id: id },
    });
    if (!existingOffer) return { code: false, res: "Record not found!" };

    // RMOVE IMAGE FROM S3 BUCKET IF ALREADY EXITS //
    if (existingOffer.thumbnail !== null && existingOffer.thumbnail !== "") {
      const thumbnail = existingOffer.thumbnail;
      if (thumbnail.includes("amazonaws") !== -1) {
        deleteFileFromS3(process.env.RIVETTE_BUCKET, `rewards/${thumbnail}`);
      }
    }
    const result = await MobileDiscountProduct.destroy({
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
