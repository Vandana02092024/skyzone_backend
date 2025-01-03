import { Categories } from "../../../../config/tables.js";
import { Op } from "sequelize";

export const getCategoriesByRange = async (req, res) => {
  try {
    const points = req.query.points;

    if (!points) {
      return res
        .status(400)
        .json({ success: false, message: "Points parameter is required" });
    }

    const categories = await Categories.findAll({
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

    if (!categories) return { code: false, res: "No record found." };
    else return { code: true, res: categories };
  } catch (error) {
    return { code: false, res: err.message };
  }
};
