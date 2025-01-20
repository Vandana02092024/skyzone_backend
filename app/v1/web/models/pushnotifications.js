import { Op } from "sequelize";
import { PushNotifications } from "../../../../config/tables.js";

export const findAll = async (page, items_per_page, search = false) => {
  var where = {};
  if (search !== false) {
    where = {
      [Op.or]: [
        { title: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } },
      ],
    };
  }

  try {
    const { count, rows } = await PushNotifications.findAndCountAll({
      where: where,
      limit: items_per_page,
      offset: (page - 1) * items_per_page,
      order: [['id', 'DESC']],
    });

    if (!count) return { code: false, res: "No records found." };
    else
      return {
        code: true,
        listing: rows,
        total_pages: Math.ceil(count / items_per_page),
      };
  } catch (error) {
    return { code: false, res: error.message };
  }
};

// GET COUNT //
export const GetCount = async () => {
  const res = await PushNotifications.count();

  if (res) return { code: true, res: res };
  else return { code: false, res: [] };
};

// INSERT NEW NOTITFICATION //
export const Add = async (data) => {
  const notification = await PushNotifications.create(data);

  if (notification) return { code: true, res: notification };
  else return { code: false, res: [] };
};

// GET SINGLE NOTIFICATION BY ID
export const GetById = async (id) => {
  const notification = await PushNotifications.findByPk(id);

  if (notification) return { code: true, res: notification };
  else return { code: false, res: [] };
};

// UPDATE NOTIFICATION BY ID //
export const UpdateById = async (upData, id) => {
  const updatedNotification = await PushNotifications.update(upData, {
    where: { id: id },
  });

  if (updatedNotification) return { code: true, res: updatedNotification };
  else return { code: false, res: [] };
};

// DELETE RECORD //
export const Remove = async (id) => {
  try {
    const del = await PushNotifications.destroy({
      where: { id: id },
    });

    if (del) return { code: true, res: del };
    else return { code: false, res: "Can't delete record." };
  } catch (error) {
    return { code: false, res: error.message };
  }
};
