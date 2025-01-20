import { Op } from "sequelize";
import { ClientMaster, User, UserLocations } from "../../../../config/tables.js";

// ## FIND USER BY USERNAME ONLY //

const getUserLocations = async (userid) => {
  try {
    const res = await UserLocations.findAll({
      attributes: ['client_id'],
      where: { user_id: userid },
    });
    return res;
  } catch (err) {
    return { code: false, res: err.message };
  }
}

const getUserLocationsDetails = async (userid) => {
  try {
    const res = await UserLocations.findAll({
      attributes: [],
      where: { user_id: userid },
      include: [
        {
          model: ClientMaster,
          attributes: ["location","client_id"],
        },
      ],
    });
    return res;
  } catch (err) {
    return { code: false, res: err.message };
  }
}

export const getUser = async (select, where) => {
  try {
    const res = await User.findOne({
      attributes: select,
      where: where,
    });

    return res;
  } catch (err) {
    return { code: false, res: err.message };
  }
};

export const findSingleUser = async (select, where,userid) => {
  try {
    const res = await User.findOne({
      attributes: select,
      where: where,
    });

    const locations = await getUserLocations(userid);
    const Loc = locations.map(param => String(param.client_id));
     // Combine user data with locations
     const userWithLocations = {
      ...res.toJSON(), // Convert Sequelize instance to plain object
      location: Loc,
    };

    if (!res) return { code: false, res: "User is not registered with us." };
    else return { code: true, res: userWithLocations };
  } catch (err) {
    return { code: false, res: err.message };
  }
};

export const findSingleUserDetails = async (select, where,userid) => {
  try {
    const res = await User.findOne({
      attributes: select,
      where: where,
    });

    const locations = await getUserLocationsDetails(userid);
    const loc = locations.map((record) => record.clientmaster.location);
     // Combine user data with locations
     const userWithLocations = {
      ...res.toJSON(), // Convert Sequelize instance to plain object
      location: loc,
    };

    if (!res) return { code: false, res: "User is not registered with us." };
    else return { code: true, res: userWithLocations };
  } catch (err) {
    return { code: false, res: err.message };
  }
};

// ## FIND ALL USERS //
export const getAllUsers = async (
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
        { username: { [Op.like]: `%${search}%` } },
        { first_name: { [Op.like]: `%${search}%` } },
      ],
      status: status,
    };
    if(userId) {
      where = {
        [Op.or]: [
          { username: { [Op.like]: `%${search}%` } },
          { first_name: { [Op.like]: `%${search}%` } },
        ],
        status: status,
        created_by: userId
      };
    }
  }

  try {
    const res = await User.findAll({
      where: where,
      attributes: [
        "id",
        "username",
        "first_name",
        "contact_number",
        "email",
        "status",
        "created",
      ],
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
        { username: { [Op.like]: `%${search}%` } },
        { first_name: { [Op.like]: `%${search}%` } },
      ],
      status: status,
    };
  }

  const res = await User.count({ where: where });

  if (res) return { status: true, data: res };
  else return { status: false, data: [] };
};

// ## CRAETE A NEW USER //
export const createUser = async (insert) => {
  const res = await User.create(insert);
  if (!res)
    return { code: false, res: "There is some issue while adding new user." };
  else return { code: true, res: res };
};

export const createUserLocations = async (locations,userid) => {
  try {
    const insertLocation = locations.map(location => {
      return UserLocations.create({
        id: `${userid}-${location}`,
        user_id: userid,
        client_id: location
      });
    });
    // Wait for all insertions to complete
    await Promise.all(insertLocation);
    return { code: true, res: 'success' };
  } catch (error) {
    console.error('Error creating user locations data:', error);
    return { code: false, res: error.message };
  }
};

// ## UPDATE EXISTING USER //
export const updateUser = async (updateDt, id,locations=null) => {
  try {
    const res = await User.update(updateDt, { where: { id: id } });
    if (res) {
      if(locations) {
        await UserLocations.destroy({where: { user_id: id } });
        const insertLocation = locations.map(location => {
          return UserLocations.create({
            id: `${id} - ${location}`,
            user_id: id,
            client_id: location
          });
        });
        // Wait for all insertions to complete
        await Promise.all(insertLocation);
      }
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

export const userDeactivated = async (id) => {
  try {
    const res = await User.update({ status: 0 }, { where: { id: id } });
    if (!res)
      return {
        code: false,
        res: "There is some issue while delete the record.",
      };
    else return { code: true, res: res };
  } catch (error) {
    return { code: false, res: err.message };
  }
};
