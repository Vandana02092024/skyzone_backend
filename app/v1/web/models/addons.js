import { Op } from "sequelize";
import {
  AddOns,
  RestProductParent,
  RestProducts,
} from "../../../../config/tables.js";

export const getAddons = async (
  location_id,
  card_id,
  page,
  items_per_page,
  search = false
) => {
  var where = { client_id: location_id };
  if (search !== false) {
    where = {
      [Op.or]: [{ name: { [Op.like]: `%${search}%` } }],
      client_id: location_id,
    };
  }

  try {
    const addOns = await RestProductParent.findAll({
      attributes: ["name", "shortDescription", "Pid"],
      include: [
        {
          model: RestProducts,
          attributes: ["Pid", "parent_id", "name", "imageUrl", "cost"],
          required: true,
          include: [
            {
              model: AddOns,
              required: true,
              attributes: ["id"],
              where: { client_id: location_id, card_id: card_id },
            },
          ],
          where: where,
        },
      ],
    });

    if (Object.keys(addOns).length === 0)
      return { code: false, res: "No record found." };
    else return { code: true, res: addOns };
  } catch (error) {
    return { code: false, res: error.message };
  }
};

export const GetCount = async (location_id, card_id) => {
  var where = { client_id: location_id, card_id: card_id };
  const res = await AddOns.count({ where: where });

  if (res) return { status: true, data: res };
  else return { status: false, data: [] };
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
          attributes: ["Pid", "name", "imageUrl", "cost"],
          where: where,
          include: [
            {
              model: AddOns,
              required: false,
              attributes: ["id"],
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

export const GetProductsCount = async (location_id) => {
  var where = { client_id: location_id };
  const res = await RestProductParent.count({ where: where });

  if (res) return { status: true, data: res };
  else return { status: false, data: [] };
};

export const CreateAddon = async (nAddon) => {
  try {
    const result = await AddOns.create(nAddon);

    if (!result) return { code: false, res: "Can't create new record." };
    else return { code: true, res: result };
  } catch (error) {
    return { code: false, res: error.message };
  }
};

export const SelectAddonBy = async (select, where) => {
  try {
    const addOns = await AddOns.findAll({
      attributes: select,
      where: where,
    });

    if (Object.keys(addOns).length === 0)
      return { code: false, res: "No record found." };
    else return { code: true, res: addOns };
  } catch (error) {}
};

export const deleteAddonRecord = async (id) => {
  try {
    const checkRecord = await AddOns.findOne({
      where: { id: id },
    });
    if (!checkRecord) return { code: false, res: "Record is not found" };

    const result = await AddOns.destroy({
        where: {
          id: id,
         }
    });

    if (!result) return { code: false, res: "Can't delete record." };
    else return { code: true, res: result };
  } catch (error) {
    return { code: false, res: error.message };
  }
}
