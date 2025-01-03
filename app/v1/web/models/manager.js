import { Op } from "sequelize";
import { ClientMaster, Managers } from "../../../../config/tables.js";



// ## CRAETE A NEW MANAGER //
export const createManager = async (insert) => {
  const res = await Managers.create(insert);
  if (!res)
    return { code: false, res: "There is some issue while adding new user." };
  else return { code: true, res: res };
};

// ## FIND ALL MANAGER //
export const getAllManagers = async (
  status,
  page,
  items_per_page,
  search = false,
  userId = null,
) => {
  
  var where = { status: status};
  if (userId) {
    var where = { status: status , created_by: userId};
  }

  if (search !== false) {
    where = {
      [Op.or]: [
        { fname: { [Op.like]: `%${search}%` } },
        { lname: { [Op.like]: `%${search}%` } },
        { designation: { [Op.like]: `%${search}%` } },
      ],
      status: status,
    };
    if(userId) {
      where = {
        [Op.or]: [
          { fname: { [Op.like]: `%${search}%` } },
          { lname: { [Op.like]: `%${search}%` } },
          { designation: { [Op.like]: `%${search}%` } },
        ],
        status: status,
        created_by: userId
      };
    }
  }

  try {
    const res = await Managers.findAll({
      where: where,
      offset: (page - 1) * items_per_page,
      limit: items_per_page,
    });

    if (!res) return { code: false, res: "There are no users in our system." };
    else return { code: true, res: res };
  } catch (err) {
    return { code: false, res: err.message };
  }
};

// GET COUNT //
export const getCount = async (status,userId=false, search = false) => {
  var where = { status: status };
  if(userId != false){
    where = {status: status, created_by: userId}
  }

  if (search !== false) {
    where = {
      [Op.or]: [
        { fname: { [Op.like]: `%${search}%` } },
        { lname: { [Op.like]: `%${search}%` } },
        { designation: { [Op.like]: `%${search}%` } },
      ],
      status: status,
    };
  }

  const res = await Managers.count({ where: where });

  if (res) return { status: true, data: res };
  else return { status: false, data: [] };
};

export const findSingleManager = async (select, where) => {
  try {
    const res = await Managers.findOne({
      attributes: select,
      where: where,
    });

    if (!res) return { code: false, res: "Manager is not found." };
    else return { code: true, res: res };
  } catch (err) {
    return { code: false, res: err.message };
  }
};

export const getManager = async (select, where) => {
  try {
    const res = await Managers.findOne({
      attributes: select,
      where: where,
    });

    return res;
  } catch (err) {
    return { code: false, res: err.message };
  }
};

// ## UPDATE EXISTING USER //
export const updateManager = async (updateDt, id) => {
  try {
    const res = await Managers.update(updateDt, { where: { id: id } });
    if (res) {
      return { code: true, res: res };
    }
    else{
      return {
        code: false,
        res: "There is some issue while updating the record.",
      };
    }
  } catch (error) {
    return { code: false, res: error.message };
  }
};

export const ManagerDeactivated = async (id) => {
  try {
    const findmanager = await Managers.findOne({
      where: { id: id },
    });
    if (!findmanager){
      return {
        code: false,
        res: "Manager is not found.",
      };
    } 
    let status;
    const checkstatus = findmanager?.status;
    if(checkstatus == 1){
      status = 0;
    } else {
      status = 1;
    }
  const res = await Managers.update({ status: status }, { where: { id: id } });
    if (!res)
      return {
        code: false,
        res: "There is some issue while delete the record.",
      };
    else return { code: true, res: res };
  } catch (error) {
    return { code: false, res: error.message };
  }
};
