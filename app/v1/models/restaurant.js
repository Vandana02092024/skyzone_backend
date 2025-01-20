import { Sequelize, Op } from 'sequelize';

import {
    User,
    MobileCustomers,
    RestProducts,
    RestProductParent,
    ClientMaster,
    RestaurantMenuItem,
    RestaurantOfferBanners,
    RestaurantPopularItems,
    RestaurantOrder,
    RestaurantOrderItem,
    MobileTransactionFee,
    UserLocations,
  } from '../../../config/tables.js';

import bcrypt from 'bcrypt';

const restaurantService = {};

restaurantService.getMenuItems = async (clientId, categoryId = null,page,items_per_page) => {
    try {
      const query = {
        attributes: [
          [Sequelize.col('restProductParent.name'), 'parent_name'],
          [Sequelize.col('restProductParent.shortDescription'), 'parent_description'],
          [Sequelize.col('restProduct.Pid'), 'Pid'],
          [Sequelize.col('restProduct.parent_id'), 'parent_id'],
          [Sequelize.col('restProduct.name'), 'name'],
          [Sequelize.col('restProduct.cost'), 'cost'],
          [Sequelize.col('restProduct.imageUrl'), 'imageUrl'],
          ...['id', 'client_id', 'parent_product_id', 'product_id', 'title', 'description', 'price', 'thumbnail', 'created_at']
            .map(attr => Sequelize.col(`RestaurantMenuItem.${attr}`))
        ],
        include: [
          {
            model: RestProducts,
            as: 'restProduct',
            attributes: []
          },
          {
            model: RestProductParent,
            as: 'restProductParent',
            attributes: []
          }
        ],
        where: {
          client_id: clientId,
          ...(categoryId && { '$restProductParent.Pid$': categoryId })
        },
        order: [['parent_id', 'ASC']],
        offset: (page - 1) * items_per_page,
        limit: items_per_page,
      };
  
      const items = await RestaurantMenuItem.findAll(query);
      return items;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
};

restaurantService.getMenuItems1 = async (clientId, categoryId = null,page,items_per_page) => {
  try {
    const query = {
      attributes: [
        [Sequelize.col('restProductParent.name'), 'parent_name'],
        [Sequelize.col('restProductParent.shortDescription'), 'parent_description'],
        [Sequelize.col('restProduct.Pid'), 'Pid'],
        [Sequelize.col('restProduct.parent_id'), 'parent_id'],
        [Sequelize.col('restProduct.name'), 'name'],
        [Sequelize.col('restProduct.cost'), 'cost'],
        [Sequelize.col('restProduct.imageUrl'), 'imageUrl'],
        'id', 'client_id', 'parent_product_id', 'product_id', 'title', 'description', 'price', 'thumbnail', 'created_at'
      ],
      include: [
        {
          model: RestProducts,
          as: 'restProduct',
          attributes: []
        },
        {
          model: RestProductParent,
          as: 'restProductParent',
          attributes: []
        }
      ],
      where: {
        client_id: clientId,
        ...(categoryId && { '$restProductParent.Pid$': categoryId })
      },
      order: [['parent_id', 'ASC']],
      offset: (page - 1) * items_per_page,
      limit: items_per_page,
    };

    const items = await RestaurantMenuItem.findAll(query);
    const total_items = await RestaurantMenuItem.count(query);

   const menuItem =   items.map(item => item.get({ plain: true }));  // Convert to plain objects if needed
   const  data = {
        items :menuItem,
        total:total_items
     }
     return data;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
};

restaurantService.paginateRecords = (data, items) => {
    const { items_per_page = 10, page = 1 } = data;
  
    const startIndex = (page - 1) * items_per_page;
    const endIndex = page * items_per_page;
  
    return items.slice(startIndex, endIndex);
};

restaurantService.getOffersBanner = async (clientId=0) => {
    try {
      const query = {
        attributes: [
          'id',
          'thumbnail'
        ],
        where: {
          client_id: clientId
        },
        order: [['id', 'DESC']]
      };
  
      const items = await RestaurantOfferBanners.findAll(query);
      return items;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
};

restaurantService.getPopularItems = async (clientId, categoryId = null, search = null, page,items_per_page) => {
    try {
      let searchCondition = {};
      if (search) {
        searchCondition = {
          [Op.or]: [
            { '$restaurantMenuItem.description$': { [Op.like]: `%${search}%` } },
            { '$restaurantMenuItem.title$': { [Op.like]: `%${search}%` } }
          ]
        };
      }
  
      const whereCondition = {
        '$restaurantMenuItem.client_id$': clientId,
        ...searchCondition
      };
  
      if (categoryId && categoryId !=0) {
        whereCondition['$restaurantMenuItem.restProductParent.Pid$'] = categoryId;
      }
  
      const { count, rows: items } = await RestaurantPopularItems.findAndCountAll({
        attributes: [
          'id',
          [Sequelize.col('restaurantMenuItem.description'), 'description'],
          [Sequelize.col('restaurantMenuItem.title'), 'title'],
          [Sequelize.col('restaurantMenuItem.thumbnail'), 'thumbnail'],
          [Sequelize.col('restaurantMenuItem.restProduct.imageUrl'), 'imageUrl'],
          [Sequelize.col('restaurantMenuItem.restProductParent.name'), 'parent_name'],
          [Sequelize.col('restaurantMenuItem.restProduct.parent_id'), 'parent_id'],
          [Sequelize.col('restaurantMenuItem.restProduct.cost'), 'cost']
        ],
        include: [
          {
            model: RestaurantMenuItem,
            as: 'restaurantMenuItem',
            attributes: [],
            include: [
              {
                model: RestProducts,
                as: 'restProduct',
                attributes: []
              },
              {
                model: RestProductParent,
                as: 'restProductParent',
                attributes: []
              }
            ]
          }
        ],
        where: whereCondition,
        order: [
          ['cost', 'DESC'],
          ['quantity', 'DESC']
        ],
        offset: (page - 1) * items_per_page,
        limit: items_per_page,
      });
  
      const data =  {
        items:items,
        total:count
      }
      return data;
    } catch (error) {
      console.error('Error fetching popular items:', error);
      throw error;
    }
};

restaurantService.checkUser = async (username, password) => {
    try {
        const user = await User.findOne({
            where: { username: username },
            attributes: ['id', 'username', 'first_name', 'password', 'role']
        });
        if(user.role !==3) {
          return { status: 'false', message: 'Invalid role' };
        }

        const getLocation = await UserLocations.findOne({
          where: { user_id: user.id },
          attributes: ['client_id']
        });
        if(!getLocation) {
          return { status: 'false', message: 'User location not found' };
        }
        const location_id = getLocation.client_id;
        user.client_id = location_id;

        if (user) {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                return { status: 'true', data: user };
            } else {
                return { status: 'false', message: 'Invalid password' };
            }
        } else {
            return { status: 'false', message: 'User not found' };
        }
    } catch (error) {
        console.error('Error in login API:', error);
        throw error;
    }
};

restaurantService.getOrder = async (order_id) => {
    try {
        const list = await RestaurantOrder.findOne({
            where: { order_id: order_id }
        });

        if (list) {
            return { status: 'true', data: list };
        } else {
            return { status: 'false', message: 'Order not found' };
        }
    } catch (error) {
        console.error('Error in getOrder API:', error);
        throw error;
    }
};

restaurantService.realtimeOrderSchema = async (orderDetails, order_status = 'PENDING') => {
    const order_id = orderDetails.order_id;
    try {
        const orderItems = await RestaurantOrderItem.findAll({
            where: { order_id: order_id }
        });

        if (!orderItems || orderItems.length === 0) {
            return { status: false, message: 'There are no items for this order ID: ' + order_id };
        }

        // Fetch customer details
        const customer = await MobileCustomers.findOne({
            where: { id: orderDetails.customer_id },
            attributes: ['fname', 'lname', 'email', 'phone']
        });

        // Parse dates
        const order_date = new Date(orderDetails.order_date).toISOString();
        const payment_date = new Date(orderDetails.payment_date).toISOString();

        // Process order items
        let items = [];
        let order_total_cost = 0;

        orderItems.forEach(item => {
            items.push({
                id: item.id,
                product_id: item.product_id,
                category: {
                    id: item.category_id,
                    name: item.category_name
                },
                name: item.product_name,
                qty: item.quantity,
                cost: item.cost,
                total: item.amount
            });
            order_total_cost += item.amount;
        });

        // Fetch transaction fee
        // let transactionFee = 0.00;
        // const transactionFeeDt = await MobileTransactionFee.findOne();
        // if (transactionFeeDt && transactionFeeDt.fee > 0) {
        //     transactionFee = transactionFeeDt.fee;
        // }

        const final_order = {
            order_path: `orders/${orderDetails.client_id}/${orderDetails.customer_id}/${order_id}`,
            order_detail: {
                id: order_id,
                customer: {
                    id: orderDetails.customer_id,
                    name: `${customer.fname} ${customer.lname}`
                },
                date: new Date(order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                time: new Date(order_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                status: order_status,
                subtotal: order_total_cost,
                tax: 0.00,
                // transactionFee: transactionFee,
                others: 0,
                total: orderDetails.total_cost,
                items: items,
                timestamp: Math.floor(new Date(order_date).getTime() / 1000),
                isNotified: true,
            }
        };

        return { status: 'true', schema: final_order };
    } catch (error) {
        console.error('Error in getOrder API:', error);
        throw error;
    }
};

restaurantService.OrderUpdate = async (data, order_id) => {
    try {
        const updatedRows = await RestaurantOrder.update(data, {
            where: { order_id: order_id }
        });

        if (updatedRows) {
            return { status: 'true', message: 'Order updated successfully' };
        } else {
            return { status: 'false', message: 'Order not found or no changes made' };
        }
    } catch (error) {
        console.error('Error in OrderUpdate API:', error);
        throw error;
    }
};

restaurantService.searchOrders = async (client_id, customer_id = null, order_id = null,page,items_per_page) => {
    try {
      const orderFilter = order_id ? { order_id: order_id } : {};
      const customerFilter = customer_id ? { customer_id: customer_id } : {};
  
      const { count, rows: items } = await RestaurantOrder.findAndCountAll({
        where: {
          client_id: client_id,
          status: {
            [Op.ne]: '0',
          },
          ...orderFilter,
          ...customerFilter,
        },
        include: [
          {
            model: RestaurantOrderItem,
            include: [{
              model: RestProducts,
              attributes: ['name', 'imageUrl']
            }]
          },
          {
            model: ClientMaster,
            attributes: ['client_timezone']
          }
        ],
        order: [['created', 'DESC']],
        offset: (page - 1) * items_per_page,
        limit: items_per_page,
      });
  
      const data =  {
        items:items,
        total:count
      }
      return data;
    } catch (error) {
      console.error('Error in searchOrders:', error);
      throw error;
    }
};

restaurantService.getUserProfile = async (id) => {
    const userProfile = await User.findOne({
      where: { id },
      include: {
        model: ClientMaster,
        attributes: ['location','address','reply_to','phone_number'],
      },
    });
  
    return userProfile ? userProfile.toJSON() : null;
  };
  
restaurantService.getOrderStatusCount = async (client_id) => {
    const orderStatus = await RestaurantOrder.findAll({
      where: { client_id },
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('*')), 'total_orders'],
        [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN kitchen_status = 'PENDING' THEN 1 ELSE 0 END")), 'pending_count'],
        [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN kitchen_status = 'COMPLETED' THEN 1 ELSE 0 END")), 'completed_count'],
        [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN kitchen_status IN ('PREPARING', 'ACCEPTED') THEN 1 ELSE 0 END")), 'inprocess_count'],
      ],
      group: ['client_id'],
    });
  
    return orderStatus.length ? orderStatus[0].toJSON() : null;
};

export default restaurantService;