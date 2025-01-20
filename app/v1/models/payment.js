import { Sequelize, Op } from 'sequelize';

import {
    RestProducts,
    RestProductParent,
    MobileBookings,
    MobileBookingItems,
    MobileBookingPayment,
    ClientMaster,
    MobileCustomers,
    MobileCustomerStripeKeys,
    MobileTransactionFee,
    LatestOfferings,
    MobileCustomerChildren,
    MobileBookingDiscounts,
    RestaurantOrder,
    RestaurantOrderItem,
    RestaurantPopularItems,
    RestaurantMenuItem,

  } from '../../../config/tables.js';
  import  CommonFunction from "../../../helper/common.js";

const paymentService = {};

paymentService.checkBookingThrottle = async (customer_id) => {
    try {
        const throttleData = await MobileBookings.findOne({
          where: {
            customer_id: customer_id,
            status:0,
            created: {
              [Op.gte]: new Date(Date.now() - 60 * 1000), // Check if created within the last minute
            },
          },
        });
    
        return throttleData; // Return true if no records found, otherwise false
      } catch (error) {
        console.error('Error in bookingThrottle:', error);
        throw error;
      }
};

paymentService.getClientInfo = async (clientId, select = false) => {
    try {
        const attributes = select ? select.split(', ') : [
          'client_id',
          'client_name',
          'location',
          'latitude',
          'longitude',
          'address',
          'phone_number',
          [Sequelize.literal("''"), 'time'],
          'stripe_account_id'
        ];
    
        const clientData = await ClientMaster.findOne({
          where: { client_id: clientId },
          attributes,
        });
    
        return clientData ? clientData.toJSON() : null;
      } catch (error) {
        console.error('Error in clientInfo:', error);
        throw error;
      }
};

paymentService.getBookingDetail = async (bookingId) => {
    try {
    
        const bookingData = await MobileBookings.findOne({
          where: { booking_id: bookingId },
        });
    
        return bookingData ? bookingData.toJSON() : null;
      } catch (error) {
        console.error('Error in clientInfo:', error);
        throw error;
      }
};

paymentService.deleteBookingItems = async (bookingId) => {
    try {
        const result = await MobileBookingItems.destroy({
          where: {
            booking_id: bookingId,
          },
        });
    
        return result; // Returns the number of rows affected
      } catch (error) {
        console.error('Error in deleteBookingItems:', error);
        throw error;
      }
};

paymentService.deleteBookingPayments = async (bookingId) => {
    try {
        const result = await MobileBookingPayment.destroy({
          where: {
            booking_id: bookingId,
          },
        });
    
        return result; // Returns the number of rows affected
      } catch (error) {
        console.error('Error in deleteBookingPayment:', error);
        throw error;
      }
};

paymentService.generateBookingId = async (clientId) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 9000) + 1000;
    const bookingId = `${clientId}RIV${timestamp}`; // Optionally add ${random} if needed
    return bookingId;
};

paymentService.getCustomerData = async (customerId, clientId) => {
    try {
        // Perform the query using Sequelize
        const customer = await MobileCustomers.findOne({
          attributes: ['id','fname', 'lname', 'email'],
          where: { id: customerId },
          include: [
            {
              model: MobileCustomerStripeKeys,
              as: 'MobileCustomerStripeKey', // alias defined in association
              attributes: ['stripe_customer_id'],
              where: { client_id: clientId },
              required: false, // LEFT JOIN
            },
          ],
        });
    
        if (!customer) {
          throw new Error('Customer not found');
        }
    
        const customerInfo = {
          id: customer.id,
          fname: customer.fname,
          lname: customer.lname,
          email: CommonFunction.decrypt(customer.email),
          stripe_customer_id: customer.MobileCustomerStripeKey
            ? customer.MobileCustomerStripeKey.stripe_customer_id
            : null,
        };
    
        return customerInfo;
      } catch (error) {
        console.error('Error fetching customer information:', error);
        throw error;
      }
};

paymentService.insertDetails = async (customer_id,customer_key,client_id) => {
    try {
        const result = await MobileCustomerStripeKeys.create({
          mob_customer_id: customer_id,
          stripe_customer_id: customer_key,
          client_id: client_id,
        });
        
        return result;
    } catch (error) {
        console.error('Error in insertDetails:', error);
        throw error;
    }
};

paymentService.getTransactionFee = async () => {
    try {
    const result = await MobileTransactionFee.findOne({
            attributes: ['fee'],
            where: { id: 1 }
        });
    
        return result ? result.toJSON() : null;
      } catch (error) {
        console.error('Error in clientFee:', error);
        throw error;
      }
};

paymentService.updateBooking = async (updates, where) => {
    try {
      const result = await MobileBookings.update(updates, {
        where: where,
      });
      return result;
    } catch (error) {
      console.error('Error in updateBooking:', error);
      throw error;
    }
};

paymentService.createBookingItems = async (bookingId, data) => {
    try {
      const bookingItems = data.items.map(item => {
        const newItem = {
          booking_id: bookingId,
          product_id: item.productId,
          quantity: item.quantity,
          cost: item.priceOverride,
          tax: item.tax,
          start_time: item.startTime,
          end_time: item.endTime,
          comments: item.comments,
        };
        
        if (item.packageProductId && item.packageProductId !== "0") {
          newItem.package_id = item.packageProductId;
        }
  
        return newItem;
      });
  
      const result = await MobileBookingItems.bulkCreate(bookingItems);
      return result;
    } catch (error) {
      console.error('Error in createBookingItems:', error);
      throw error;
    }
};

paymentService.createBookingPayment = async (bookingId, data) => {
    try {
      const newPayment = {
        booking_id: bookingId,
        payment_id: data.payment_id,
        type: 'CreditCard', // You can modify this if needed
        fee: data.fee,
        amount: data.total_cost,
      };
  
      const result = await MobileBookingPayment.create(newPayment);
      return result; // Returns the created payment record
    } catch (error) {
      console.error('Error in createBookingPayment:', error);
      throw error;
    }
};

// create booking functions

const createChildren = async (data, customer_id) => {
    const returnArray = [];
  
    for (const value of data) {
      let id = 0;
      let self = 0;
  
      if (value.id) {
        id = parseInt(value.id, 10);
      }
  
      if (value.self) {
        self = parseInt(value.self, 10);
      }
  
      if (self > 0) {
        // Fetch details for the customer with the given customer_id
        const customer = await MobileCustomers.findOne({
          attributes: [
            'fname',
            'lname',
            [Sequelize.literal("DATE_FORMAT(NOW(), '%Y') - DATE_FORMAT(dob, '%Y') - (DATE_FORMAT(NOW(), '00-%m-%d') < DATE_FORMAT(dob, '00-%m-%d'))"), 'age'],
            [Sequelize.literal(customer_id), 'customer_id'],
            [Sequelize.literal(customer_id), 'self_id'],
            'id'
          ],
          where: { id: customer_id }
        });
  
        if (customer) {
          returnArray.push(customer.toJSON());
        }
      } else if (id > 0) {
        // Fetch details for the child with the given id
        const child = await MobileCustomerChildren.findOne({
          attributes: [
            'fname', 
            'lname', 
            [Sequelize.literal("dob"), 'date_of_birth'],
            'age', 
            'customer_id', 
            'id'
        ],
          where: { id }
        });
  
        if (child) {
          returnArray.push(child.toJSON());
        }
      } else {
        // Insert new child record
        const age = value.date_of_birth ? new Date().getFullYear() - new Date(value.date_of_birth).getFullYear() : 0;
        const dob = value.date_of_birth || '';
  
        const newChild = await MobileCustomerChildren.create({
          fname: value.fname,
          lname: value.lname,
          dob,
          age,
          customer_id
        });
  
        returnArray.push({
          fname: value.fname,
          lname: value.lname,
          date_of_birth: dob,
          age,
          customer_id,
          id: newChild.id
        });
      }
    }
  
    return returnArray;
};
  
const addBookingTickets = async (data, itemId, bookingId) => {
    const returnArray = [];
  
    for (const value of data) {
      const ticketId = Math.floor(Math.random() * (100000 - 10000) + 10000); // Generates a random integer between 10000 and 100000
      const insArry = {
        child_id: value.id,
        ticket_id: ticketId,
        child_name: `${value.fname} ${value.lname}`,
        booking_id: bookingId,
        booking_item_id: itemId,
      };
  
      if (value.self_id) {
        insArry.self_id = value.self_id;
      }
  
      try {
        const ticket = await MobileBookings.create(insArry);
        insArry.id = ticket.id; // Assuming `id` is auto-generated by the database
        returnArray.push(insArry);
      } catch (error) {
        console.error('Error creating booking ticket:', error);
        throw error;
      }
    }
  
    return returnArray;
};
  
const createBookingDiscounts = async (bookingId, data) => {
    try {
        if(data?.discounts) {
            const discountPromises = data?.discounts.map(async (discount) => {
                const insArry = {
                  booking_id: bookingId,
                  discount_code: discount.discount_code,
                  percentage: discount.percentage,
                  amount: discount.amount,
                };
          
                // Create a new discount entry in the database
                const newDiscount = await MobileBookingDiscounts.create(insArry);
                return newDiscount; // Optionally return the created discount
              });
          
              // Wait for all discount creation promises to resolve
              const discounts = await Promise.all(discountPromises);
            return discounts;
        }
      
    } catch (error) {
      console.error('Error creating booking discounts:', error);
      throw error;
    }
};

paymentService.createBooking = async (data, customerData) => {
    const { booking_id, customer_id, card_id, total_cost, total_quantity, total_discount, total_tax, booking_date, capacity_reservation_id, payment_id, comments, client_id, offer_id, type, items } = data;
  
    try {
      const bookingData = {
        booking_id,
        name: `${customerData.fname} ${customerData.lname} (Mobile App)`, // Customize as needed
        total_cost,
        total_quantity,
        total_discount,
        total_tax,
        booking_date,
        capacity_reservation_id,
        customer_id,
        payment_id,
        comments,
        client_id,
      };
  
      // Handle Offer
      if (offer_id > 0) {
        const offer = await LatestOfferings.findOne({ where: { id: offer_id } });
        if (offer) {
          bookingData.offer_id = offer_id;
          bookingData.camp_type = offer.camp_type;
  
          if (offer.camp_type === '1') {
            bookingData.reward_points = offer.reward_points;
          } else if (offer.camp_type === '2') {
            data.discounts = [
              {
                discount_code: offer.discount_code,
                amount: offer.discount_type === '0' ? offer.discount_amount : undefined,
                percentage: offer.discount_type === '1' ? offer.discount_percent : undefined,
              },
            ];
          }
        }
      }
  
      if (type === '1') {
        bookingData.type = type;
      }
  
      // Create Booking
      const booking = await MobileBookings.create(bookingData);
  
      // Create Payment
      const paymentData = {
        booking_id,
        payment_id,
        type: 'CreditCard',
        fee: data.fee,
        amount: total_cost,
      };
  
      await MobileBookingPayment.create(paymentData);
  
      // Add Booking Items
      for (const item of items) {
        const itemData = {
          booking_id,
          product_id: item?.productId,
          quantity: item?.quantity,
          cost: item?.priceOverride,
          tax: '0.00',
          start_time: item?.startTime,
          end_time: item?.endTime,
          comments: item?.comments,
        };
  
        if (item?.packageProductId && item?.packageProductId !== '0') {
          itemData.package_id = item?.packageProductId;
        }
        const bookingItem = await MobileBookingItems.create(itemData);
  
        // Add Ticket Details for Membership Booking
        if (item.children && item.children.length > 0) {
          // Assuming functions to handle children and tickets
          const children = await createChildren(item.children, customer_id);
          await addBookingTickets(children, bookingItem.id, booking_id);
        }
      }
  
      // Add Discounts
      await createBookingDiscounts(booking_id, data);
  
      return true;
    } catch (error) {
      console.error('Error in createBooking:', error);
      throw error;
    }
};

paymentService.getProduct = async (productId,clientId) => {
    try {
    
        const data = await RestProducts.findOne({
          where: { Pid: productId , client_id: clientId },
        });
    
        return data ? data.toJSON() : null;
      } catch (error) {
        console.error('Error in clientInfo:', error);
        throw error;
      }
};

// Restaurent Orders Payment functions

const getItemDetail = async (itemId) => {
  try {
    const itemDetail = await RestaurantMenuItem.findOne({
      attributes: [
        'id', 'description', 'title', 'thumbnail'
      ],
      include: [
        {
          model: RestProducts,
           as: 'restProduct',
          attributes: ['Pid', 'imageUrl', 'cost', 'parent_id'],
          include: [
            {
              model: RestProductParent,
              attributes: ['name']
            }
          ]
        },
        {
          model: RestaurantPopularItems,
          attributes: []
        }
      ],
      where: { id: itemId },
      order: [
        [Sequelize.col('restProduct.cost'), 'DESC'],
        [Sequelize.col('RestaurantPopularItem.quantity'), 'DESC']
      ]
    });

    if (itemDetail) {
      return {
        id: itemDetail.id,
        description: itemDetail.description,
        title: itemDetail.title,
        thumbnail: itemDetail.thumbnail,
        imageUrl: itemDetail?.restProduct?.imageUrl,
        parent_name: itemDetail?.restProduct?.RestProductParent?.name,
        product_id: itemDetail?.restProduct?.Pid,
        parent_id: itemDetail?.restProduct?.parent_id,
        cost: itemDetail?.restProduct?.cost
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching item detail:', error);
    throw error;
  }
};


// Function to get order details
paymentService.getOrderDetail = async (orderId) => {
  return await RestaurantOrder.findOne({ where: { order_id: orderId } });
};

// Function to delete order items
paymentService.deleteOrderItems = async (orderId) => {
  return await RestaurantOrderItem.destroy({ where: { order_id: orderId } });
};

// Function to generate order ID
paymentService.generateOrderId = (client) => {
  return `${client}RIVORD${Date.now()}`;
};

// Function to create order items
paymentService.createOrderItems = async (orderId, items) => {
  const orderItems = items.map(item => ({
    order_id: orderId,
    product_id: item.productId,
    category_id: item.category_id,
    quantity: item.quantity,
    cost: item.priceOverride,
    tax: item.tax,
    comments: item.comments
  }));
  return await RestaurantOrderItem.bulkCreate(orderItems);
};

// Function to create an order
paymentService.createOrder = async (data, customerDt) => {
  const orderId = data.order_id;
  const customerId = customerDt.id;
  const orderDate = data.order_date;

    const itemTax = 0.00;
    let orderTotalCost = 0;
    let orderTotalQty = 0;

  const orderItems = await Promise.all(data.items.map(async (item) => {
    const itemDt = await getItemDetail(item.id);

    const insArry = {
      menu_item_id: item.id,
      order_id: orderId,
      product_id: itemDt.product_id,
      category_id: itemDt.parent_id,
      product_name: itemDt.title,
      category_name: itemDt.parent_name,
      quantity: item.quantity,
      cost: itemDt.cost,
      tax: itemTax,
      amount: ((itemDt.cost + itemTax) * item.quantity),
      comments: item.comments
    };

    const lineItemTotal = (itemDt.cost * item.quantity);
    const lineItemQuantity = item.quantity;

    orderTotalCost += lineItemTotal;
    orderTotalQty += lineItemQuantity;
    return insArry;
  }));

  await RestaurantOrderItem.bulkCreate(orderItems);

  const order = await RestaurantOrder.create({
    order_id: orderId,
    title: `${customerDt.fname} ${customerDt.lname} (Restaurant Order)`,
    total_cost: orderTotalCost,
    total_quantity: orderTotalQty,
    total_discount: 0,
    total_tax: 0,
    order_date: orderDate,
    customer_id: customerId,
    comments: data.comments,
    client_id: data.client_id
  });

  return order;
};

// Function to update an order
paymentService.updateOrder = async (updates, where) => {
  return await RestaurantOrder.update(updates, { where });
};

export default paymentService;