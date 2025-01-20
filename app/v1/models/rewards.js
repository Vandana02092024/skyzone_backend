import { Sequelize, Op } from 'sequelize';

import {
    MobileDiscountProduct,
    Category,
    RestProducts,
    CustomerLoyaltyPointsRedeemed,
    CustomerLoyaltyPoints,
    ClientMaster
  } from '../../../config/tables.js';
import dotenv from 'dotenv';
dotenv.config();

const rewardService ={};

rewardService.getDiscountProducts = async (client_id) => {
try {
    const productDt = await MobileDiscountProduct.findAll({
      where: { client_id },
      include: [
        {
          model: Category,
          attributes: ['Description', 'pRange'],
        },
        {
          model: RestProducts,
          attributes: ['Pid', 'name', 'imageUrl'],
        },
      ],
      order: [['points', 'ASC']],
    });

    const product_ary = {};
    const category_ary = {};
    const final_response = [];

    productDt.forEach(value => {
      const desc = value.Category.Description;
      if (!product_ary[desc]) {
        product_ary[desc] = [];
      }

      product_ary[desc].push({
        id: value.id,
        product_id: value?.rest_product?.Pid,
        name: value?.rest_product?.name,
        thumbnail: value?.thumbnail,
        alt_thumbnail: value?.rest_product?.imageUrl,
        points: value?.points,
      });

      category_ary[desc] = {
        category: value.Category.pRange,
        level: desc,
        products: product_ary[desc],
      };
    });

    for (const key in category_ary) {
      if (Object.prototype.hasOwnProperty.call(category_ary, key)) {
        final_response.push(category_ary[key]);
      }
    }

    return final_response ? final_response : {};
  } catch (error) {
    console.error('Error fetching discount products:', error);
    return {};
  }
}
rewardService.getDiscountProduct = async (client_id, product_id) => {
    let search = product_id ? { id: product_id, client_id } : { client_id };
    return await MobileDiscountProduct.findOne({
      where: search,
      include: [{
        model: Category,
        attributes: ['Description', 'pRange']
      }, {
        model: RestProducts,
        attributes: ['Pid', 'name', 'imageUrl']
      }]
    });
}
  
rewardService.getRedeemProduct = async (product, client_id, customer_id) => {
   const data = await CustomerLoyaltyPointsRedeemed.findOne({
      where: {
        customer_id,
        client_id,
        discount_id: product?.discount_id,
        point_redeemed: product?.points,
        status: '0'
      }
    });
    return data;
}
  
rewardService.redeemRewards = async(product, client_id, customer_id) => {
  try {
    const newEntry = await CustomerLoyaltyPointsRedeemed.create({
      customer_id,
      discount_id: product.discount_id,
      client_id,
      product_id: product.product_id,
      product_name: product.product_name,
      discount_code: product.discount_code,
      point_redeemed: product.point_redeemed,
      qr_url: product.qr_url,
      redemeed_date: new Date(),
      status: '0'
    });
    return newEntry.id;
    } catch (error) {
    console.error('Error in redeemRewards:', error);
  }
}

rewardService.QrScanned = async (customer_id, client_id, id) => {
  try {
    let result = await CustomerLoyaltyPointsRedeemed.findOne({
      where: {
        customer_id,
        client_id,
        id,
      },
    });

    if (!result) {
      return { error: true, status: 404, message: 'No data available.' };
    }

    if (result.status === '0') {
      await result.update({
        status: '1',
        redemeed_date: new Date(),
      });

      result = await CustomerLoyaltyPointsRedeemed.findOne({
        where: {
          customer_id,
          client_id,
          id,
        },
      });

      const point_redeemed = result.point_redeemed;
      await rewardService.redeemCustomerPoints(point_redeemed, customer_id, client_id);
    }

    result.qr_url = process.env.ALREADY_REDEEMED;

    return result;
  } catch (error) {
    console.error('Error in QrScanned:', error);
  }
};

rewardService.redeemCustomerPoints = async (points_redeemed, customer_id, client_id) => {
  try {
    const results = await CustomerLoyaltyPoints.findAll({
      where: {
        customer_id,
        client_id,
        point_remaining: { [Op.gt]: 0 },
        status: '0',
      },
      order: [['expire_date', 'ASC']],
    });

    for (let value of results) {
      const expire_date = new Date(value.expire_date);
      const now = new Date();

      // POINTS ARE JUST EXPIRED //
      if (now >= expire_date) {
        await value.update({
          point_remaining: 0,
          status: '2',
        });
      } else {
        const rem_points = value.point_remaining;

        if (points_redeemed > rem_points) {
          const used_pt = value.point_used;
          const used = used_pt + rem_points;
          points_redeemed -= rem_points;

          await value.update({
            point_used: used,
            point_remaining: 0,
            status: '1',
          });
        } else {
          await value.update({
            point_used: value.point_used + points_redeemed,
            point_remaining: rem_points - points_redeemed,
          });
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error redeeming customer points:', error);
  }
};

rewardService.listScannedQrs = async (client_id, customer_id, items_per_page, page) => {
  try {
    const { count, rows: results } = await CustomerLoyaltyPointsRedeemed.findAndCountAll({
      where: {
        client_id,
        customer_id,
        status: '1'
      },
      include: [
        {
          model: MobileDiscountProduct,
          attributes: ['thumbnail']
        },
        {
          model: ClientMaster,
          attributes: ['client_timezone'], // Adding the timezone from ClientMaster
          required: true // Ensuring the join happens
        }
      ],
      attributes: [
        'id',
        [Sequelize.fn('ROUND', Sequelize.col('point_redeemed')), 'point_redeemed'],
        [Sequelize.literal(`'${process.env.ALREADY_REDEEMED}'`), 'qr_url'],
        // Use Sequelize to convert timezone and format the date similar to MySQL's DATE_FORMAT
        [Sequelize.fn(
          'DATE_FORMAT',
          Sequelize.fn(
            'CONVERT_TZ', 
            Sequelize.col('redemeed_date'), 
            'UTC', 
            Sequelize.col('clientmaster.client_timezone')
          ),
          '%Y-%m-%dT%H:%i:%sZ'
        ), 'redemeed_date'],
        'status',
        'product_name'
      ],
      order: [['redemeed_date', 'DESC']],
      offset: (page - 1) * items_per_page,
      limit: items_per_page,
    });

    const data = {
      res: results,
      total: count,
  };
    return data;
  } catch (error) {
    console.error('Error fetching scanned QR codes:', error);
    throw error;
  }
};

export default rewardService;