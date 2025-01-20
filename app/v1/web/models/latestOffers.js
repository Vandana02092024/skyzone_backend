import {
  LatestOfferings,
  RestProductParent,
  LatestOfferProducts,
  RestProducts,
} from "../../../../config/tables.js";

export const getLatestOfferDetails = async (offerId) => {
  try {
    const latest_offerings = await LatestOfferings.findOne({
      where: { id: offerId },
      include: [
        {
          model: LatestOfferProducts,
          include: [
            {
              model: RestProducts,
            },
          ],
        },
      ],
    });

    if (latest_offerings) {
      return latest_offerings;
    } else {
      return {};
    }
  } catch (error) {
    console.error("Error fetching latest_offerings:", error);
  }
};

export const getLatestOffers = async (
  location_id,
  status,
  page,
  items_per_page
) => {
  try {
    const latest_offerings = await LatestOfferings.findAll({
      where: {
        client_id: location_id,
        status: status,
      },
      order: [["id", "DESC"]],
      offset: (page - 1) * items_per_page,
      limit: items_per_page,
    });
    const totalRec = await LatestOfferings.count({
      where: {
        client_id: location_id,
        status: status,
      },
    });

    const data = {
      items: latest_offerings,
      total: totalRec,
    };
    if (data) {
      return data;
    } else {
      return {};
    }
  } catch (error) {
    console.error("Error fetching latest offers:", error);
  }
};

export const checkLatestOffer = async (offerId) => {
  try {
    const existingOffer = await LatestOfferings.findOne({
      where: { id: offerId },
    });
    return existingOffer;
  } catch (error) {
    console.error("Error in checkLatestOffer:", error);
  }
};

export const updateLatestOffer = async (data, offerId, image) => {
  try {
    const selected_products = data.selected_products;
    const title = data.title;
    const description = Buffer.from(data.description).toString("utf-8");
    const camp_type = data.camp_type;
    const camp_start_date = data.camp_start_date;
    const camp_end_date = data.camp_end_date;
    const discount_code = data.discount_code;
    const discount_type = data.discount_type;
    const discount_amount = data.discount_amount;
    const discount_percent = data.discount_percent;
    const reward_points = data.reward_points;
    const offer_type = data.offer_type;
    const display_to = data.display_to;
    const result = await LatestOfferings.update(
      {
        title: title,
        description: description,
        camp_type: camp_type,
        image,
        camp_start_date: camp_start_date,
        camp_end_date: camp_end_date,
        discount_code: discount_code,
        discount_type: discount_type,
        discount_amount: discount_amount,
        discount_percent: discount_percent,
        reward_points: reward_points,
        offer_type: offer_type,
        display_to: display_to,
      },
      {
        where: { id: offerId },
      }
    );

    if (selected_products) {
      await Promise.all(
        selected_products.map(async (products) => {
          await LatestOfferProducts.create({
            parent_product_id: products.parent_id,
            product_id: products.Pid,
            offer_id: offerId,
          });
        })
      );
    }
    if (result) {
      return result;
    } else {
      return {};
    }
  } catch (error) {
    console.error("Error in updateLatestOffer:", error);
  }
};

export const addLatestOffer = async (data, image) => {
  try {
    const selected_products = data.selected_products;
    const title = data.title;
    const description = Buffer.from(data.description).toString("utf-8");
    const camp_type = data.camp_type;
    const camp_start_date = data.camp_start_date;
    const camp_end_date = data.camp_end_date;
    const discount_code = data.discount_code;
    const discount_type = data.discount_type;
    const discount_amount = data.discount_amount;
    const discount_percent = data.discount_percent;
    const reward_points = data.reward_points;
    const offer_type = data.offer_type;
    const display_to = data.display_to;
    const client_id = data.client_id;
    const result = await LatestOfferings.create({
      title: title,
      description: description,
      camp_type: camp_type,
      image,
      camp_start_date: camp_start_date,
      camp_end_date: camp_end_date,
      discount_code: discount_code,
      discount_type: discount_type,
      discount_amount: discount_amount,
      discount_percent: discount_percent,
      reward_points: reward_points,
      offer_type: offer_type,
      display_to: display_to,
      client_id: client_id,
    });

    if (selected_products) {
      await Promise.all(
        selected_products.map(async (products) => {
          await LatestOfferProducts.create({
            parent_product_id: products.parent_id,
            product_id: products.Pid,
            offer_id: result.id,
          });
        })
      );
    }
    if (result) {
      return result;
    } else {
      return {};
    }
  } catch (error) {
    console.error("Error in addLatestOffer:", error);
  }
};

export const getProductsWithParent = async (location_id, typeCondition) => {
  try {
    const results = await RestProductParent.findAll({
      where: {
        ...typeCondition,
      },
      attributes: [
        ["parentProductId", "parent_id"],
        ["name", "parent_name"],
        ["imageUrl", "parent_img"],
        ["shortDescription", "parent_description"],
      ],
      include: [
        {
          model: RestProducts,
          where: { client_id: location_id },
        },
      ],
      order: [["Pid", "ASC"]],
      limit: 10,
    });
    if (results) {
      return results;
    } else {
      return {};
    }
  } catch (error) {
    console.error("Error in getProductsWithParent:", error);
  }
};

export const deleteOfferProducts = async (id) => {
  try {
    const result = await LatestOfferProducts.destroy({ where: { id: id } });
    return result;
  } catch (error) {
    console.error("Error deleting product:", error);
  }
};

export const updateOffersStatus = async (statusUp, offerId) => {
  try {
    const affectedRows = await LatestOfferings.update(
      {
        status: statusUp,
      },
      {
        where: { id: offerId },
      }
    );
    return affectedRows;
  } catch (error) {
    console.error("Error in updateOffersStatus:", error);
  }
};

export const deleteOfferWithProducts = async (offerId) => {
  try {
    const latest_offerings = await LatestOfferings.destroy({
      where: { id: offerId },
    });

    if (latest_offerings) {
      await LatestOfferProducts.destroy({
        where: { offer_id: offerId },
      });
    }
    return latest_offerings;
  } catch (error) {
    console.error("Error in deleteOffer:", error);
  }
};
