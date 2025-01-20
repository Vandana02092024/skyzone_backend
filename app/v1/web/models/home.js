import { ClientMaster, User , UserLocations , MobileCustomers, MobileCustomerQueries , MobileGeneralQueries , MobileCustomersPreferedLocation } from "../../../../config/tables.js";
import CommonFunction from "../../../../helper/common.js";
import { Op } from "sequelize";

export const GetLocationByUser = async (user_id) => {
  try {
    // const res = await ClientMaster.findAll({
    //   attributes: [
    //     ["location", "label"],
    //     ["client_id", "id"],
    //     ["client_id", "value"],
    //   ],
    //   where: { status: "1" },
    //   include: {
    //     model: User,
    //     required: true,
    //     where: { id: user_id },
    //   },
    // });
    const locations = await UserLocations.findAll({
      attributes: [],
      where: { user_id: user_id },
      include: [
        {
          model: ClientMaster,
          attributes: ["location","client_id"],
          // where: { status: "1" },
        },
      ],
    });
    const res = locations.map((record) => ({
      label: record.clientmaster.location, // Assuming "locations" should be "location"
      value: record.clientmaster.client_id,
      id: record.clientmaster.client_id,
    }));
    // const user = await User.findOne({
    //   where: { id: user_id },
    // })
    // const res = {
    //   location, // Convert Sequelize instance to plain object
    //   User: user,
    // };
    if (!res) return { code: false, res: "No record found." };
    else return { code: true, res: res };
  } catch (error) {
    console.error(error);
    return { code: false, res: error.message };
  }
};

export const GetAllLocations = async () => {
  try {
    const res = await ClientMaster.findAll({
      attributes: [
        ["location", "label"],
        ["client_id", "id"],
        ["client_id", "value"],
      ],
      where: { status: "1" },
    });
    if (!res) return { code: false, res: "No record found." };
    else return { code: true, res: res };
  } catch (error) {
    return { code: false, res: error.message };
  }
};

export const getCustomesQueriesData = async (client_id, filters) => {
  try {
    const { page, items_per_page, search = '', status } = filters;
    const limit = items_per_page;
    const offset = (page - 1) * limit;

    // Build where clause for the parent model
    const customerWhereClause = {};

    // Build where clause for the child model
    const queryWhereClause = {};
    if (status !== null) {
      queryWhereClause.status = status;
    }
    if (search) {
      queryWhereClause[Op.or] = [
        { subject: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } },
        { '$mobile_customer.fname$': { [Op.like]: `%${search}%` } },
        { '$mobile_customer.lname$': { [Op.like]: `%${search}%` } },
      ];
    }
    let customerIds;
    if(client_id) {
        const getCustomersId = await MobileCustomersPreferedLocation.findAll({
          attributes: ['client_id','customerId'],
          where: { client_id: client_id },
        });
        if(getCustomersId) {
          customerIds = getCustomersId.map(item => item.customerId);
        }
    }
    if(customerIds && customerIds.length > 0) {
      customerWhereClause['id'] = { [Op.in]: customerIds };
    }

    const { count, rows } = await MobileCustomerQueries.findAndCountAll({
      where: queryWhereClause,
      include: [
        {
          model: MobileCustomers,
          attributes: [
            'id',
            'fname',
            'lname',
            'email',
            'phone',
          ],
          where: customerWhereClause,
          required: true, // Ensures only customers with queries are included
        },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']], // Sort by creation date (most recent first)
    });

    if (!rows || rows.length === 0) {
      return { code: false, res: "No records found." };
    }

    // Return paginated data
    return {
      code: true,
      res: {
        data: rows,
        total:count,
        page,
        limit,
        total_pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error("Error in getCustomesQueriesData:", error);
    return { code: false, res: "Internal server error. Please try again later." };
  }
};


export const getGeneralQueriesData = async (filters) => {
  try {
    const { page, items_per_page, search = '' } = filters;
    const limit = items_per_page;
    const offset = (page - 1) * limit;

    // Build where clause for the parent model
    const WhereClause = {};
    if (search) {
      WhereClause[Op.or] = [
        { user: { [Op.like]: `%${search}%` } },
        { subject: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await MobileGeneralQueries.findAndCountAll({
      where: WhereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']],// Sort by creation date (most recent first)
    });

    if (!rows || rows.length === 0) {
      return { code: false, res: "No records found." };
    }

    // Return paginated data
    return {
      code: true,
      res: {
        data: rows,
        total:count,
        page,
        limit,
        total_pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error("Error in getGeneralQueriesData:", error);
    return { code: false, res: "Internal server error. Please try again later." };
  }
};
